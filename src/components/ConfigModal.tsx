import { TextAttributes } from "@opentui/core";
import type { WorkSchedule } from "../types/index.ts";

interface ConfigModalProps {
  schedule: WorkSchedule;
  activeField: ConfigField;
  cursorPosition: number; // 0-3 for HH:MM (0=H tens, 1=H units, 2=M tens, 3=M units)
  blinkOn: boolean;
  saving: boolean;
  error: string | null;
}

export type ConfigField = "morningStart" | "morningEnd" | "afternoonStart" | "afternoonEnd";

const COLORS = {
  border: "#a78bfa",
  active: "#67e8f9",
  inactive: "#64748b",
  error: "#f87171",
  cursor: "#fbbf24",
};

const FIELD_LABELS: Record<ConfigField, string> = {
  morningStart: "Morning Start",
  morningEnd: "Morning End",
  afternoonStart: "Afternoon Start",
  afternoonEnd: "Afternoon End",
};

interface TimeFieldProps {
  label: string;
  value: string;
  isActive: boolean;
  cursorPosition: number;
  blinkOn: boolean;
}

function padTime(value: string): string {
  // Ensure we have HH:MM format
  const parts = value.split(":");
  const hours = (parts[0] ?? "00").padStart(2, "0");
  const minutes = (parts[1] ?? "00").padStart(2, "0");
  return `${hours}:${minutes}`;
}

function TimeField({ label, value, isActive, cursorPosition, blinkOn }: TimeFieldProps) {
  const paddedValue = padTime(value);
  const chars = paddedValue.split("");
  
  // Map cursor position to character index (skip the colon at index 2)
  const charIndexMap = [0, 1, 3, 4]; // positions 0,1,2,3 -> chars 0,1,3,4
  
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
            const digitPosition = charIndexMap.indexOf(idx);
            const isCursor = isActive && digitPosition === cursorPosition;
            
            if (isColon) {
              return <text key={idx} attributes={isActive ? TextAttributes.BOLD : 0}>:</text>;
            }
            
            if (isCursor) {
              return (
                <box key={idx} backgroundColor={blinkOn ? COLORS.cursor : undefined}>
                  <text attributes={TextAttributes.BOLD}>{char}</text>
                </box>
              );
            }
            
            return (
              <text key={idx} attributes={isActive ? TextAttributes.BOLD : 0}>
                {char}
              </text>
            );
          })}
        </box>
      </box>
    </box>
  );
}

export function ConfigModal({ schedule, activeField, cursorPosition, blinkOn, saving, error }: ConfigModalProps) {
  return (
    <box
      flexDirection="column"
      padding={1}
      borderStyle="rounded"
      borderColor={COLORS.border}
      minWidth={40}
    >
      <box justifyContent="center" marginBottom={1}>
        <text attributes={TextAttributes.BOLD}>Work Schedule Settings</text>
      </box>

      {error && (
        <box justifyContent="center" marginBottom={1}>
          <text attributes={TextAttributes.BOLD}>{error}</text>
        </box>
      )}

      <box flexDirection="column" gap={1} marginBottom={1}>
        <box marginBottom={1}>
          <text attributes={TextAttributes.DIM}>Morning</text>
        </box>
        <TimeField
          label="  Start"
          value={schedule.morning.start}
          isActive={activeField === "morningStart"}
          cursorPosition={cursorPosition}
          blinkOn={blinkOn}
        />
        <TimeField
          label="  End"
          value={schedule.morning.end}
          isActive={activeField === "morningEnd"}
          cursorPosition={cursorPosition}
          blinkOn={blinkOn}
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
          blinkOn={blinkOn}
        />
        <TimeField
          label="  End"
          value={schedule.afternoon.end}
          isActive={activeField === "afternoonEnd"}
          cursorPosition={cursorPosition}
          blinkOn={blinkOn}
        />
      </box>

      {saving ? (
        <box justifyContent="center">
          <text attributes={TextAttributes.DIM}>Saving...</text>
        </box>
      ) : (
        <box justifyContent="center" gap={2}>
          <text attributes={TextAttributes.DIM}>[Arrows] Edit</text>
          <text attributes={TextAttributes.DIM}>[Tab] Next field</text>
          <text attributes={TextAttributes.DIM}>[Enter] Save</text>
        </box>
      )}
    </box>
  );
}

// Helper functions for time manipulation
export function adjustTimeDigit(time: string, position: number, delta: number): string {
  const padded = padTime(time);
  const hours = parseInt(padded.slice(0, 2), 10);
  const minutes = parseInt(padded.slice(3, 5), 10);
  
  let newHours = hours;
  let newMinutes = minutes;
  
  switch (position) {
    case 0: // Hours tens (0-2)
      newHours = adjustWithWrap(hours, delta * 10, 0, 23);
      break;
    case 1: // Hours units
      newHours = adjustWithWrap(hours, delta, 0, 23);
      break;
    case 2: // Minutes tens (0-5)
      newMinutes = adjustWithWrap(minutes, delta * 10, 0, 59);
      break;
    case 3: // Minutes units
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
