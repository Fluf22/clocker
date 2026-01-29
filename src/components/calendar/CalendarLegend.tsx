import { TextAttributes } from "@opentui/core";
import { CALENDAR_COLORS } from "../../constants/calendar.ts";

export function CalendarLegend() {
  return (
    <box flexDirection="row" justifyContent="space-around" marginTop={1}>
      <box flexDirection="row" gap={1}>
        <text attributes={TextAttributes.BOLD}>*</text>
        <text attributes={TextAttributes.DIM}>Today</text>
      </box>
      <box flexDirection="row" gap={1}>
        <box backgroundColor={CALENDAR_COLORS.missing} width={2}><text> </text></box>
        <text attributes={TextAttributes.DIM}>Missing</text>
      </box>
      <box flexDirection="row" gap={1}>
        <box backgroundColor={CALENDAR_COLORS.hasHours} width={2}><text> </text></box>
        <text attributes={TextAttributes.DIM}>Logged</text>
      </box>
      <box flexDirection="row" gap={1}>
        <box backgroundColor={CALENDAR_COLORS.timeOff} width={2}><text> </text></box>
        <text attributes={TextAttributes.DIM}>Time Off</text>
      </box>
      <box flexDirection="row" gap={1}>
        <box backgroundColor={CALENDAR_COLORS.holiday} width={2}><text> </text></box>
        <text attributes={TextAttributes.DIM}>Holiday</text>
      </box>
    </box>
  );
}
