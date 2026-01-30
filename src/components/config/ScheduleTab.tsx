import { memo } from "react";
import type { WorkSchedule } from "../../types/index.ts";
import type { ConfigField } from "../../types/config.ts";
import { TimePeriodSection } from "./TimePeriodSection.tsx";

export const ScheduleTab = memo(function ScheduleTab({ 
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
    </>
  );
});
