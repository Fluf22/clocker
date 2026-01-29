import { TextAttributes } from "@opentui/core";
import { MODAL_COLORS } from "../constants/modalColors.ts";
import type { EditModalProps } from "../types/editModal.ts";
import { TimeField } from "./config/TimeField.tsx";
import { calculateTotalHours, formatTotalHours } from "../utils/schedule.ts";

export type { EditField } from "../types/editModal.ts";
export { adjustTimeDigit } from "../utils/time.ts";
export { getScheduleHours, extractScheduleFromEntries } from "../utils/schedule.ts";

export function EditModal({ date, schedule, activeField, cursorPosition, saving, error, isFutureMonth }: EditModalProps) {
  const displayDate = new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const totalHours = calculateTotalHours(schedule);

  return (
    <box
      flexDirection="column"
      padding={1}
      borderStyle="rounded"
      borderColor={isFutureMonth ? MODAL_COLORS.warning : MODAL_COLORS.border}
      minWidth={40}
    >
      <box justifyContent="center" marginBottom={1}>
        <text attributes={TextAttributes.BOLD}>{displayDate}</text>
      </box>

      {error && (
        <box justifyContent="center" marginBottom={1}>
          <text attributes={TextAttributes.BOLD}>{error}</text>
        </box>
      )}

      {isFutureMonth ? (
        <>
          <box justifyContent="center" marginBottom={1}>
            <text>Timesheet not open yet</text>
          </box>
          <box justifyContent="center" marginBottom={1}>
            <text attributes={TextAttributes.DIM}>This month's timesheet is not available for editing.</text>
          </box>
          <box justifyContent="center">
            <text attributes={TextAttributes.DIM}>[Esc] Close</text>
          </box>
        </>
      ) : (
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

          <box justifyContent="center" marginBottom={1}>
            <text attributes={TextAttributes.BOLD}>{`Total: ${formatTotalHours(totalHours)}`}</text>
          </box>

          {saving ? (
            <box justifyContent="center">
              <text attributes={TextAttributes.DIM}>Saving...</text>
            </box>
          ) : (
            <box justifyContent="center" gap={2}>
              <text attributes={TextAttributes.DIM}>[Arrows] Edit</text>
              <text attributes={TextAttributes.DIM}>[Tab] Next</text>
              <text attributes={TextAttributes.DIM}>[Enter] Save</text>
            </box>
          )}
        </>
      )}
    </box>
  );
}
