import { memo } from "react";
import { MODAL_COLORS } from "../constants/modalColors.ts";
import type { ConfigModalProps } from "../types/config.ts";
import {
  TabBar,
  ScheduleTab,
  ConnectionsTab,
  InputModeTab,
  ModalHeader,
  ErrorDisplay,
  InputStatusBar,
  ScheduleStatusBar,
  ConnectionsStatusBar,
  TabSwitchHint,
  SavingIndicator,
} from "./config/index.ts";

export type { ConfigTab, ConfigField, ConnectionAction, InputMode, ConnectionStatus, ConfigModalProps } from "../types/config.ts";
export { adjustTimeDigit } from "../utils/time.ts";

export const ConfigModal = memo(function ConfigModal({ 
  activeTab,
  schedule, 
  activeField, 
  cursorPosition, 
  connections,
  selectedConnection,
  inputMode,
  inputLabel,
  inputPlaceholder,
  saving, 
  error,
  onInputChange,
  onInputSubmit,
  onInputRef,
}: ConfigModalProps) {
  const isInputMode = inputMode !== "none";

  return (
    <box
      flexDirection="column"
      padding={1}
      borderStyle="rounded"
      borderColor={MODAL_COLORS.border}
      minWidth={45}
    >
      {!isInputMode && <ModalHeader />}

      {!isInputMode && <TabBar activeTab={activeTab} />}

      {error && <ErrorDisplay error={error} />}

      {isInputMode ? (
        <InputModeTab 
          inputMode={inputMode}
          inputLabel={inputLabel}
          inputPlaceholder={inputPlaceholder}
          onInputChange={onInputChange}
          onInputSubmit={onInputSubmit}
          onInputRef={onInputRef}
        />
      ) : activeTab === "schedule" ? (
        <ScheduleTab 
          schedule={schedule} 
          activeField={activeField} 
          cursorPosition={cursorPosition} 
        />
      ) : (
        <ConnectionsTab 
          connections={connections} 
          selectedConnection={selectedConnection} 
        />
      )}

      {saving ? (
        <SavingIndicator />
      ) : (
        <box justifyContent="center" gap={2}>
          {isInputMode ? (
            <InputStatusBar />
          ) : activeTab === "schedule" ? (
            <><ScheduleStatusBar /><TabSwitchHint /></>
          ) : (
            <><ConnectionsStatusBar /><TabSwitchHint /></>
          )}
        </box>
      )}
    </box>
  );
});
