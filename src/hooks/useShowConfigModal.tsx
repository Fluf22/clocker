import { useCallback, type MutableRefObject, type ReactNode } from "react";
import type { CliRenderer, InputRenderable } from "@opentui/core";
import { ConfigModal, adjustTimeDigit, type ConfigField, type ConfigTab, type ConnectionAction, type InputMode } from "../components/ConfigModal.tsx";
import { loadCredentials, saveCredentials } from "../config/credentials.ts";
import { loadGmailConfig, saveGmailConfig } from "../config/gmail.ts";
import { verifyGmailCredentials } from "../email/sender.ts";
import { openBrowser } from "../utils/cli.ts";
import type { Employee, BasicCredentials, WorkSchedule, AppSettings } from "../types/index.ts";

interface DialogActions {
  show: (options: { content: () => ReactNode; closeOnEscape?: boolean; backdropOpacity?: number; id?: string; onClose?: () => void }) => unknown;
  close: () => void;
}

interface ConfigModalState {
  dialogOpen: boolean;
  saving: boolean;
  saveError: string | null;
  configSchedule: WorkSchedule | null;
  configActiveField: ConfigField;
  configCursorPosition: number;
  configActiveTab: ConfigTab;
  configSelectedConnection: ConnectionAction;
  configConnections: {
    bamboohr: { configured: boolean; domain: string | undefined };
    gmail: { configured: boolean; email: string | undefined };
  };
  configInputMode: InputMode;
  configInputValue: string;
  configInputLabel: string;
  configInputPlaceholder: string | undefined;
  configInputData: { domain: string; apiKey: string };
  configInputRef: InputRenderable | null;
}

interface UseShowConfigModalParams {
  dialog: DialogActions;
  renderer: CliRenderer;
  stateRef: MutableRefObject<ConfigModalState>;
  settings: AppSettings;
  updateSettings: (settings: AppSettings) => Promise<void>;
  employee: Employee | null;
}

export function useShowConfigModal({
  dialog,
  renderer,
  stateRef,
  settings,
  updateSettings,
  employee,
}: UseShowConfigModalParams): () => Promise<void> {
  return useCallback(async () => {
    if (stateRef.current.dialogOpen) return;
    stateRef.current.dialogOpen = true;
    
    stateRef.current.configSchedule = {
      morning: { ...settings.workSchedule.morning },
      afternoon: { ...settings.workSchedule.afternoon },
    };
    stateRef.current.configActiveField = "morningStart";
    stateRef.current.configCursorPosition = 0;
    stateRef.current.configActiveTab = "schedule";
    stateRef.current.configSelectedConnection = "bamboohr";
    stateRef.current.configInputMode = "none";
    stateRef.current.configInputValue = "";
    stateRef.current.configInputLabel = "";
    stateRef.current.configInputData = { domain: "", apiKey: "" };
    stateRef.current.saveError = null;
    stateRef.current.saving = false;
    
    const credentials = await loadCredentials();
    const gmailConfig = await loadGmailConfig();
    
    stateRef.current.configConnections = {
      bamboohr: { 
        configured: credentials !== null, 
        domain: credentials?.companyDomain,
      },
      gmail: { 
        configured: gmailConfig !== null, 
        email: gmailConfig?.email,
      },
    };
    
    let configHandlerRef: ((event: { name: string; shift?: boolean; sequence?: string }) => void) | null = null;
    let pasteHandlerRef: ((event: { text: string }) => void) | null = null;
    
    const cleanup = () => {
      if (configHandlerRef) {
        renderer.keyInput.off("keypress", configHandlerRef);
        configHandlerRef = null;
      }
      if (pasteHandlerRef) {
        renderer.keyInput.off("paste", pasteHandlerRef);
        pasteHandlerRef = null;
      }
      stateRef.current.configInputRef = null;
      stateRef.current.dialogOpen = false;
      stateRef.current.saving = false;
    };
    
    const handleInputChange = (value: string) => {
      stateRef.current.configInputValue = value;
    };

    const handleInputSubmit = (value: string) => {
      stateRef.current.configInputValue = value;
      confirmInput();
    };

    const handleInputRef = (ref: InputRenderable | null) => {
      stateRef.current.configInputRef = ref;
    };

    const pasteHandler = (event: { text: string }) => {
      const input = stateRef.current.configInputRef;
      if (input && stateRef.current.configInputMode !== "none" && !stateRef.current.saving) {
        const text = stateRef.current.configInputMode === "gmail_password" 
          ? event.text.replace(/\s/g, "") 
          : event.text;
        input.insertText(text);
      }
    };

    const updateDialog = () => {
      if (!stateRef.current.configSchedule) return;
      dialog.show({
        content: () => (
          <ConfigModal
            activeTab={stateRef.current.configActiveTab}
            schedule={stateRef.current.configSchedule!}
            activeField={stateRef.current.configActiveField}
            cursorPosition={stateRef.current.configCursorPosition}
            connections={stateRef.current.configConnections}
            selectedConnection={stateRef.current.configSelectedConnection}
            inputMode={stateRef.current.configInputMode}
            inputLabel={stateRef.current.configInputLabel}
            inputPlaceholder={stateRef.current.configInputPlaceholder}
            saving={stateRef.current.saving}
            error={stateRef.current.saveError}
            onInputChange={handleInputChange}
            onInputSubmit={handleInputSubmit}
            onInputRef={handleInputRef}
          />
        ),
        closeOnEscape: !stateRef.current.saving,
        backdropOpacity: 0.6,
        id: "config-modal",
        onClose: cleanup,
      });
    };

    const fields: ConfigField[] = ["morningStart", "morningEnd", "afternoonStart", "afternoonEnd"];
    const connections: ConnectionAction[] = ["bamboohr", "gmail"];
    
    const getFieldValue = (field: ConfigField): string => {
      if (!stateRef.current.configSchedule) return "00:00";
      switch (field) {
        case "morningStart": return stateRef.current.configSchedule.morning.start;
        case "morningEnd": return stateRef.current.configSchedule.morning.end;
        case "afternoonStart": return stateRef.current.configSchedule.afternoon.start;
        case "afternoonEnd": return stateRef.current.configSchedule.afternoon.end;
      }
    };
    
    const setFieldValue = (field: ConfigField, value: string) => {
      if (!stateRef.current.configSchedule) return;
      switch (field) {
        case "morningStart":
          stateRef.current.configSchedule.morning.start = value;
          break;
        case "morningEnd":
          stateRef.current.configSchedule.morning.end = value;
          break;
        case "afternoonStart":
          stateRef.current.configSchedule.afternoon.start = value;
          break;
        case "afternoonEnd":
          stateRef.current.configSchedule.afternoon.end = value;
          break;
      }
    };

    const saveConfig = async () => {
      if (!stateRef.current.configSchedule) return;
      
      stateRef.current.saving = true;
      stateRef.current.saveError = null;
      updateDialog();
      
      try {
        await updateSettings({
          ...settings,
          workSchedule: stateRef.current.configSchedule,
        });
        dialog.close();
      } catch (err) {
        stateRef.current.saveError = err instanceof Error ? err.message : "Save failed";
        stateRef.current.saving = false;
        updateDialog();
      }
    };

    const startInputMode = (mode: InputMode, label: string, placeholder?: string) => {
      stateRef.current.configInputMode = mode;
      stateRef.current.configInputValue = "";
      stateRef.current.configInputLabel = label;
      stateRef.current.configInputPlaceholder = placeholder;
      stateRef.current.saveError = null;
      updateDialog();
    };

    const cancelInputMode = () => {
      stateRef.current.configInputMode = "none";
      stateRef.current.configInputValue = "";
      stateRef.current.configInputLabel = "";
      stateRef.current.configInputPlaceholder = undefined;
      stateRef.current.configInputData = { domain: "", apiKey: "" };
      updateDialog();
    };

    const confirmInput = async () => {
      const mode = stateRef.current.configInputMode;
      const value = stateRef.current.configInputValue.trim();

      if (!value) {
        stateRef.current.saveError = "Value cannot be empty";
        updateDialog();
        return;
      }

      if (mode === "bamboohr_domain") {
        stateRef.current.configInputData.domain = value;
        startInputMode("bamboohr_apikey", "API Key");
        openBrowser(`https://${value}.bamboohr.com/settings/permissions/api.php`);
        return;
      }

      if (mode === "bamboohr_apikey") {
        stateRef.current.configInputData.apiKey = value;
        stateRef.current.saving = true;
        updateDialog();

        try {
          const newCredentials: BasicCredentials = {
            type: "basic",
            companyDomain: stateRef.current.configInputData.domain,
            apiKey: value,
          };
          await saveCredentials(newCredentials);
          stateRef.current.configConnections.bamboohr = {
            configured: true,
            domain: newCredentials.companyDomain,
          };
          stateRef.current.saving = false;
          cancelInputMode();
        } catch (err) {
          stateRef.current.saveError = err instanceof Error ? err.message : "Save failed";
          stateRef.current.saving = false;
          updateDialog();
        }
        return;
      }

      if (mode === "gmail_password") {
        const cleanPassword = value.replace(/\s/g, "");
        if (cleanPassword.length !== 16) {
          stateRef.current.saveError = `App password must be 16 characters (got ${cleanPassword.length})`;
          updateDialog();
          return;
        }

        const email = employee?.workEmail;
        if (!email) {
          stateRef.current.saveError = "Employee email not available";
          updateDialog();
          return;
        }

        stateRef.current.saving = true;
        updateDialog();

        const gmailConfigData = { email, appPassword: cleanPassword };

        try {
          await verifyGmailCredentials(gmailConfigData);
        } catch {
          stateRef.current.saveError = "Invalid credentials - could not connect to Gmail";
          stateRef.current.saving = false;
          updateDialog();
          return;
        }

        try {
          await saveGmailConfig(gmailConfigData);
          stateRef.current.configConnections.gmail = {
            configured: true,
            email,
          };
          stateRef.current.saving = false;
          cancelInputMode();
        } catch (err) {
          stateRef.current.saveError = err instanceof Error ? err.message : "Save failed";
          stateRef.current.saving = false;
          updateDialog();
        }
        return;
      }
    };

    const startReconfigure = () => {
      const selected = stateRef.current.configSelectedConnection;
      if (selected === "bamboohr") {
        startInputMode("bamboohr_domain", "Company Domain");
      } else if (selected === "gmail") {
        openBrowser("https://myaccount.google.com/apppasswords");
        const placeholder = stateRef.current.configConnections.gmail.configured
          ? "(Replace your current app password)"
          : undefined;
        startInputMode("gmail_password", "App Password", placeholder);
      }
    };

    const configHandler = (event: { name: string; shift?: boolean; sequence?: string }) => {
      if (stateRef.current.saving) return;

      if (stateRef.current.configInputMode !== "none") {
        if (event.name === "escape") {
          cancelInputMode();
        }
        return;
      }
      
      if (event.name === "," || event.name === "<") {
        stateRef.current.configActiveTab = "schedule";
        updateDialog();
        return;
      }
      
      if (event.name === "." || event.name === ">") {
        stateRef.current.configActiveTab = "connections";
        updateDialog();
        return;
      }
      
      if (stateRef.current.configActiveTab === "schedule") {
        if (event.name === "return") {
          saveConfig();
          return;
        }
        
        if (event.name === "tab") {
          const currentIndex = fields.indexOf(stateRef.current.configActiveField);
          const nextIndex = event.shift 
            ? (currentIndex - 1 + fields.length) % fields.length
            : (currentIndex + 1) % fields.length;
          stateRef.current.configActiveField = fields[nextIndex] ?? "morningStart";
          stateRef.current.configCursorPosition = 0;
          updateDialog();
          return;
        }
        
        if (event.name === "left") {
          stateRef.current.configCursorPosition = Math.max(0, stateRef.current.configCursorPosition - 1);
          updateDialog();
          return;
        }
        
        if (event.name === "right") {
          stateRef.current.configCursorPosition = Math.min(3, stateRef.current.configCursorPosition + 1);
          updateDialog();
          return;
        }
        
        if (event.name === "up") {
          const currentValue = getFieldValue(stateRef.current.configActiveField);
          const newValue = adjustTimeDigit(currentValue, stateRef.current.configCursorPosition, 1);
          setFieldValue(stateRef.current.configActiveField, newValue);
          updateDialog();
          return;
        }
        
        if (event.name === "down") {
          const currentValue = getFieldValue(stateRef.current.configActiveField);
          const newValue = adjustTimeDigit(currentValue, stateRef.current.configCursorPosition, -1);
          setFieldValue(stateRef.current.configActiveField, newValue);
          updateDialog();
          return;
        }
      } else {
        if (event.name === "up") {
          const currentIndex = connections.indexOf(stateRef.current.configSelectedConnection);
          const newIndex = (currentIndex - 1 + connections.length) % connections.length;
          stateRef.current.configSelectedConnection = connections[newIndex] ?? "bamboohr";
          updateDialog();
          return;
        }
        
        if (event.name === "down") {
          const currentIndex = connections.indexOf(stateRef.current.configSelectedConnection);
          const newIndex = (currentIndex + 1) % connections.length;
          stateRef.current.configSelectedConnection = connections[newIndex] ?? "bamboohr";
          updateDialog();
          return;
        }
        
        if (event.name === "return") {
          startReconfigure();
          return;
        }
      }
    };
    
    configHandlerRef = configHandler;
    pasteHandlerRef = pasteHandler;
    renderer.keyInput.on("keypress", configHandler);
    renderer.keyInput.on("paste", pasteHandler);
    updateDialog();
  }, [dialog, renderer, stateRef, settings, updateSettings, employee]);
}
