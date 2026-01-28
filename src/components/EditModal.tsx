import { TextAttributes } from "@opentui/core";
import type { TimesheetEntry } from "../types/index.ts";

interface EditModalProps {
  date: string;
  entries: TimesheetEntry[];
  hours: string;
  saving: boolean;
  error: string | null;
  onClose: () => void;
}

const COLORS = {
  border: "#a78bfa",
  input: "#67e8f9",
  error: "#f87171",
};

export function EditModal({ date, entries, hours, saving, error }: EditModalProps) {
  const displayDate = new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const existingHours = entries.reduce((sum, e) => sum + (e.hours ?? 0), 0);
  const hasExisting = existingHours > 0;
  const title = hasExisting ? `Edit Hours - ${displayDate}` : `Add Hours - ${displayDate}`;

  return (
    <box
      flexDirection="column"
      padding={1}
      borderStyle="rounded"
      borderColor={COLORS.border}
    >
      <box justifyContent="center" marginBottom={1}>
        <text attributes={TextAttributes.BOLD}>{title}</text>
      </box>

      {hasExisting && (
        <box justifyContent="center" marginBottom={1}>
          <text attributes={TextAttributes.DIM}>{`Current: ${existingHours}h (will be replaced)`}</text>
        </box>
      )}

      {error && (
        <box justifyContent="center" marginBottom={1}>
          <text attributes={TextAttributes.BOLD}>{error}</text>
        </box>
      )}

      <box justifyContent="center" marginBottom={1}>
        <box borderStyle="single" borderColor={COLORS.input} paddingLeft={1} paddingRight={1}>
          <text>{`Hours: ${hours || "0"}_`}</text>
        </box>
      </box>

      <box justifyContent="center" marginBottom={1}>
        <text attributes={TextAttributes.DIM}>Type 0-9 to set hours (e.g., 8 for 8h)</text>
      </box>

      {saving ? (
        <box justifyContent="center">
          <text attributes={TextAttributes.DIM}>Saving...</text>
        </box>
      ) : (
        <box justifyContent="center" gap={2}>
          <text attributes={TextAttributes.DIM}>[Enter] Save</text>
          <text attributes={TextAttributes.DIM}>[Esc] Cancel</text>
        </box>
      )}
    </box>
  );
}
