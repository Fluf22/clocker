import type { InputRenderable } from "@opentui/core";
import type { WorkSchedule } from "./index.ts";

export type ConfigTab = "schedule" | "connections";
export type ConfigField = "morningStart" | "morningEnd" | "afternoonStart" | "afternoonEnd";
export type ConnectionAction = "bamboohr" | "gmail";
export type InputMode = "none" | "bamboohr_domain" | "bamboohr_apikey" | "gmail_password";

export interface ConnectionStatus {
  bamboohr: { configured: boolean; domain?: string };
  gmail: { configured: boolean; email?: string };
}

export interface ConfigModalProps {
  activeTab: ConfigTab;
  schedule: WorkSchedule;
  activeField: ConfigField;
  cursorPosition: number;
  connections: ConnectionStatus;
  selectedConnection: ConnectionAction;
  inputMode: InputMode;
  inputLabel: string;
  inputPlaceholder?: string;
  saving: boolean;
  error: string | null;
  onInputChange?: (value: string) => void;
  onInputSubmit?: (value: string) => void;
  onInputRef?: (ref: InputRenderable | null) => void;
}
