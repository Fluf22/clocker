import { TextAttributes, type InputRenderable } from "@opentui/core";
import { memo, useCallback } from "react";
import type { WorkSchedule } from "../types/index.ts";

export type ConfigTab = "schedule" | "connections";
export type ConfigField = "morningStart" | "morningEnd" | "afternoonStart" | "afternoonEnd";
export type ConnectionAction = "bamboohr" | "gmail";
export type InputMode = "none" | "bamboohr_domain" | "bamboohr_apikey" | "gmail_password";

interface ConnectionStatus {
  bamboohr: { configured: boolean; domain?: string };
  gmail: { configured: boolean; email?: string };
}

interface ConfigModalProps {
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

const COLORS = {
  border: "#a78bfa",
  active: "#67e8f9",
  inactive: "#64748b",
  error: "#f87171",
  cursor: "#fbbf24",
  success: "#4ade80",
  warning: "#fbbf24",
};

function padTime(value: string): string {
  const parts = value.split(":");
  const hours = (parts[0] ?? "00").padStart(2, "0");
  const minutes = (parts[1] ?? "00").padStart(2, "0");
  return `${hours}:${minutes}`;
}

const BlinkingCursor = memo(function BlinkingCursor({ char }: { char: string }) {
  return (
    <box backgroundColor={COLORS.cursor}>
      <text attributes={TextAttributes.BOLD | TextAttributes.BLINK}>{char}</text>
    </box>
  );
});

const TimeDigit = memo(function TimeDigit({ char, isBold }: { char: string; isBold: boolean }) {
  return <text attributes={isBold ? TextAttributes.BOLD : 0}>{char}</text>;
});

const CHAR_INDEX_MAP = [0, 1, 3, 4];

const TimeField = memo(function TimeField({ 
  label, 
  value, 
  isActive, 
  cursorPosition 
}: { 
  label: string; 
  value: string; 
  isActive: boolean; 
  cursorPosition: number;
}) {
  const paddedValue = padTime(value);
  const chars = paddedValue.split("");

  return (
    <box flexDirection="row" justifyContent="space-between" gap={2}>
      <text attributes={isActive ? TextAttributes.BOLD : 0}>{label}</text>
      <box
        borderStyle="single"
        borderColor={isActive ? COLORS.active : COLORS.inactive}
        paddingLeft={1}
        paddingRight={1}
      >
        <box flexDirection="row">
          {chars.map((char, idx) => {
            const isColon = idx === 2;
            const digitPosition = CHAR_INDEX_MAP.indexOf(idx);
            const isCursor = isActive && digitPosition === cursorPosition;

            if (isColon) {
              return <TimeDigit key={idx} char=":" isBold={isActive} />;
            }

            if (isCursor) {
              return <BlinkingCursor key={idx} char={char} />;
            }

            return <TimeDigit key={idx} char={char} isBold={isActive} />;
          })}
        </box>
      </box>
    </box>
  );
});

const TabBar = memo(function TabBar({ activeTab }: { activeTab: ConfigTab }) {
  return (
    <box flexDirection="row" justifyContent="center" gap={2} marginBottom={1}>
      <box 
        borderStyle={activeTab === "schedule" ? "single" : undefined}
        borderColor={COLORS.active}
        paddingLeft={1}
        paddingRight={1}
      >
        <text attributes={activeTab === "schedule" ? TextAttributes.BOLD : TextAttributes.DIM}>
          Schedule
        </text>
      </box>
      <box 
        borderStyle={activeTab === "connections" ? "single" : undefined}
        borderColor={COLORS.active}
        paddingLeft={1}
        paddingRight={1}
      >
        <text attributes={activeTab === "connections" ? TextAttributes.BOLD : TextAttributes.DIM}>
          Connections
        </text>
      </box>
    </box>
  );
});

const ConnectionItem = memo(function ConnectionItem({ 
  label, 
  configured, 
  detail, 
  isSelected 
}: { 
  label: string; 
  configured: boolean; 
  detail?: string;
  isSelected: boolean;
}) {
  const statusIndicator = configured ? "✓" : "○";
  const statusText = configured ? "Connected" : "Not configured";

  return (
    <box flexDirection="row" gap={1} alignItems="center">
      <text attributes={isSelected ? TextAttributes.BOLD : TextAttributes.DIM}>
        {isSelected ? ">" : " "}
      </text>
      <box 
        flexDirection="column" 
        flexGrow={1}
        borderStyle={isSelected ? "single" : undefined}
        borderColor={COLORS.active}
        paddingLeft={isSelected ? 1 : 0}
        paddingRight={isSelected ? 1 : 0}
      >
        <box flexDirection="row" justifyContent="space-between">
          <text attributes={isSelected ? TextAttributes.BOLD : 0}>{label}</text>
          <text attributes={configured ? TextAttributes.BOLD : TextAttributes.DIM}>
            {statusIndicator} {statusText}
          </text>
        </box>
        {detail && (
          <text attributes={TextAttributes.DIM}>{detail}</text>
        )}
      </box>
    </box>
  );
});

const ScheduleTab = memo(function ScheduleTab({ 
  schedule, 
  activeField, 
  cursorPosition 
}: { 
  schedule: WorkSchedule; 
  activeField: ConfigField; 
  cursorPosition: number;
}) {
  return (
    <>
      <box flexDirection="column" gap={1} marginBottom={1}>
        <box marginBottom={1}>
          <text attributes={TextAttributes.DIM}>Morning</text>
        </box>
        <TimeField
          label="  Start"
          value={schedule.morning.start}
          isActive={activeField === "morningStart"}
          cursorPosition={cursorPosition}
        />
        <TimeField
          label="  End"
          value={schedule.morning.end}
          isActive={activeField === "morningEnd"}
          cursorPosition={cursorPosition}
        />
      </box>

      <box flexDirection="column" gap={1} marginBottom={1}>
        <box marginBottom={1}>
          <text attributes={TextAttributes.DIM}>Afternoon</text>
        </box>
        <TimeField
          label="  Start"
          value={schedule.afternoon.start}
          isActive={activeField === "afternoonStart"}
          cursorPosition={cursorPosition}
        />
        <TimeField
          label="  End"
          value={schedule.afternoon.end}
          isActive={activeField === "afternoonEnd"}
          cursorPosition={cursorPosition}
        />
      </box>
    </>
  );
});

const ConnectionsTab = memo(function ConnectionsTab({ 
  connections, 
  selectedConnection 
}: { 
  connections: ConnectionStatus; 
  selectedConnection: ConnectionAction;
}) {
  return (
    <box flexDirection="column" gap={2} marginBottom={1}>
      <ConnectionItem
        label="BambooHR"
        configured={connections.bamboohr.configured}
        detail={connections.bamboohr.domain ? `Domain: ${connections.bamboohr.domain}` : undefined}
        isSelected={selectedConnection === "bamboohr"}
      />
      <ConnectionItem
        label="Gmail Reminders"
        configured={connections.gmail.configured}
        detail={connections.gmail.email ? `Email: ${connections.gmail.email}` : undefined}
        isSelected={selectedConnection === "gmail"}
      />
    </box>
  );
});



const InputModeTab = memo(function InputModeTab({
  inputMode,
  inputLabel,
  inputPlaceholder,
  onInputChange,
  onInputSubmit,
  onInputRef,
}: {
  inputMode: InputMode;
  inputLabel: string;
  inputPlaceholder?: string;
  onInputChange?: (value: string) => void;
  onInputSubmit?: (value: string) => void;
  onInputRef?: (ref: InputRenderable | null) => void;
}) {
  const title = inputMode.startsWith("bamboohr") ? "BambooHR Setup" : "Gmail Setup";
  const hint = inputMode === "bamboohr_domain" 
    ? "Enter your company domain (e.g., 'yourcompany' from yourcompany.bamboohr.com)"
    : inputMode === "bamboohr_apikey"
    ? "Enter your BambooHR API key"
    : "Enter your Gmail App Password (16 characters)";

  const inputRef = useCallback((node: InputRenderable | null) => {
    onInputRef?.(node);
  }, [onInputRef]);

  return (
    <box flexDirection="column" gap={1} marginBottom={1}>
      <box justifyContent="center" marginBottom={1}>
        <text attributes={TextAttributes.BOLD}>{title}</text>
      </box>
      <box marginBottom={1}>
        <text attributes={TextAttributes.DIM}>{hint}</text>
      </box>
      <box flexDirection="column" gap={1} marginBottom={1}>
        <text attributes={TextAttributes.BOLD}>{inputLabel}</text>
        <box
          borderStyle="single"
          borderColor={COLORS.active}
          height={3}
          minWidth={40}
        >
          <input
            ref={inputRef}
            placeholder={inputPlaceholder ?? "Type or paste here..."}
            focused
            onInput={onInputChange}
            onSubmit={onInputSubmit}
          />
        </box>
      </box>
    </box>
  );
});

const InputStatusBar = memo(function InputStatusBar() {
  return (
    <>
      <text attributes={TextAttributes.DIM}>[Type] Enter value</text>
      <text attributes={TextAttributes.DIM}>[Enter] Confirm</text>
      <text attributes={TextAttributes.DIM}>[Esc] Cancel</text>
    </>
  );
});

const ModalHeader = memo(function ModalHeader() {
  return (
    <box justifyContent="center" marginBottom={1}>
      <text attributes={TextAttributes.BOLD}>Settings</text>
    </box>
  );
});

const ErrorDisplay = memo(function ErrorDisplay({ error }: { error: string }) {
  return (
    <box justifyContent="center" marginBottom={1}>
      <text attributes={TextAttributes.BOLD}>{error}</text>
    </box>
  );
});

const ScheduleStatusBar = memo(function ScheduleStatusBar() {
  return (
    <>
      <text attributes={TextAttributes.DIM}>[Arrows] Edit</text>
      <text attributes={TextAttributes.DIM}>[Tab] Next</text>
      <text attributes={TextAttributes.DIM}>[Enter] Save</text>
    </>
  );
});

const ConnectionsStatusBar = memo(function ConnectionsStatusBar() {
  return (
    <>
      <text attributes={TextAttributes.DIM}>[↑/↓] Select</text>
      <text attributes={TextAttributes.DIM}>[Enter] Reconfigure</text>
    </>
  );
});

const TabSwitchHint = memo(function TabSwitchHint() {
  return <text attributes={TextAttributes.DIM}>[&lt;/&gt;] Switch tab</text>;
});

const SavingIndicator = memo(function SavingIndicator() {
  return (
    <box justifyContent="center">
      <text attributes={TextAttributes.DIM}>Saving...</text>
    </box>
  );
});

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
      borderColor={COLORS.border}
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

export function adjustTimeDigit(time: string, position: number, delta: number): string {
  const padded = padTime(time);
  const hours = parseInt(padded.slice(0, 2), 10);
  const minutes = parseInt(padded.slice(3, 5), 10);

  let newHours = hours;
  let newMinutes = minutes;

  switch (position) {
    case 0:
      newHours = adjustWithWrap(hours, delta * 10, 0, 23);
      break;
    case 1:
      newHours = adjustWithWrap(hours, delta, 0, 23);
      break;
    case 2:
      newMinutes = adjustWithWrap(minutes, delta * 10, 0, 59);
      break;
    case 3:
      newMinutes = adjustWithWrap(minutes, delta, 0, 59);
      break;
  }

  return `${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(2, "0")}`;
}

function adjustWithWrap(value: number, delta: number, min: number, max: number): number {
  let newValue = value + delta;
  if (newValue > max) newValue = min;
  if (newValue < min) newValue = max;
  return newValue;
}
