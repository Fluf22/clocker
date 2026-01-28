import { TextAttributes } from "@opentui/core";
import type { WorkSchedule } from "../types/index.ts";

interface ConfigModalProps {
  schedule: WorkSchedule;
  activeField: ConfigField;
  saving: boolean;
  error: string | null;
}

export type ConfigField = "morningStart" | "morningEnd" | "afternoonStart" | "afternoonEnd";

const COLORS = {
  border: "#a78bfa",
  active: "#67e8f9",
  inactive: "#64748b",
  error: "#f87171",
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
}

function TimeField({ label, value, isActive }: TimeFieldProps) {
  return (
    <box flexDirection="row" justifyContent="space-between" gap={2}>
      <text attributes={isActive ? TextAttributes.BOLD : 0}>{label}</text>
      <box
        borderStyle="single"
        borderColor={isActive ? COLORS.active : COLORS.inactive}
        paddingLeft={1}
        paddingRight={1}
      >
        <text attributes={isActive ? TextAttributes.BOLD : 0}>
          {value}{isActive ? "_" : ""}
        </text>
      </box>
    </box>
  );
}

export function ConfigModal({ schedule, activeField, saving, error }: ConfigModalProps) {
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
        />
        <TimeField
          label="  End"
          value={schedule.morning.end}
          isActive={activeField === "morningEnd"}
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
        />
        <TimeField
          label="  End"
          value={schedule.afternoon.end}
          isActive={activeField === "afternoonEnd"}
        />
      </box>

      <box justifyContent="center" marginBottom={1}>
        <text attributes={TextAttributes.DIM}>Format: HH:MM (e.g., 09:00)</text>
      </box>

      {saving ? (
        <box justifyContent="center">
          <text attributes={TextAttributes.DIM}>Saving...</text>
        </box>
      ) : (
        <box justifyContent="center" gap={2}>
          <text attributes={TextAttributes.DIM}>[Tab] Next</text>
          <text attributes={TextAttributes.DIM}>[Enter] Save</text>
          <text attributes={TextAttributes.DIM}>[Esc] Cancel</text>
        </box>
      )}
    </box>
  );
}
