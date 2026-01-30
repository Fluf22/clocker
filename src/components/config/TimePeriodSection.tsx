import { TextAttributes } from "@opentui/core";
import { memo } from "react";
import type { TimeRange, ScheduleField } from "../../types/index.ts";
import { TimeField } from "./TimeField.tsx";

interface TimePeriodSectionProps {
  label: string;
  timeRange: TimeRange;
  startField: ScheduleField;
  endField: ScheduleField;
  activeField: ScheduleField;
  cursorPosition: number;
}

export const TimePeriodSection = memo(function TimePeriodSection({
  label,
  timeRange,
  startField,
  endField,
  activeField,
  cursorPosition,
}: TimePeriodSectionProps) {
  return (
    <box flexDirection="column" gap={1} marginBottom={1}>
      <box marginBottom={1}>
        <text attributes={TextAttributes.DIM}>{label}</text>
      </box>
      <TimeField
        label="  Start"
        value={timeRange.start}
        isActive={activeField === startField}
        cursorPosition={cursorPosition}
      />
      <TimeField
        label="  End"
        value={timeRange.end}
        isActive={activeField === endField}
        cursorPosition={cursorPosition}
      />
    </box>
  );
});
