import { TextAttributes } from "@opentui/core";
import { MODAL_COLORS } from "../constants/modalColors.ts";
import type { EditModalProps } from "../types/editModal.ts";
import { TimePeriodSection, ErrorDisplay, FutureMonthWarning, SavingIndicator } from "./config/index.ts";
import { calculateTotalHours, formatHoursAsDuration } from "../utils/schedule.ts";
import { KeyHint, KeyHintBar } from "./KeyHint.tsx";

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

      {error && <ErrorDisplay error={error} />}

      {isFutureMonth ? (
        <FutureMonthWarning action="editing" />
      ) : (
        <>
          <TimePeriodSection
            label="Morning"
            timeRange={schedule.morning}
            startField="morningStart"
            endField="morningEnd"
            activeField={activeField}
            cursorPosition={cursorPosition}
          />
          <TimePeriodSection
            label="Afternoon"
            timeRange={schedule.afternoon}
            startField="afternoonStart"
            endField="afternoonEnd"
            activeField={activeField}
            cursorPosition={cursorPosition}
          />

          <box justifyContent="center" marginBottom={1}>
            <text attributes={TextAttributes.BOLD}>{`Total: ${formatHoursAsDuration(totalHours)}`}</text>
          </box>

           {saving ? (
             <SavingIndicator />
           ) : (
             <KeyHintBar>
               <KeyHint keyName="Arrows" action="Edit" />
               <KeyHint keyName="Tab" action="Next" />
               <KeyHint keyName="Enter" action="Save" />
             </KeyHintBar>
           )}
        </>
      )}
    </box>
  );
}
