import { TextAttributes } from "@opentui/core";
import { memo } from "react";
import type { WorkSchedule } from "../../types/index.ts";
import type { ConfigField } from "../../types/config.ts";
import { TimeField } from "./TimeField.tsx";

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
