import { TextAttributes } from "@opentui/core";
import type { DayCardProps } from "../../types/calendar.ts";
import { CALENDAR_COLORS, DAY_CARD_CONTENT_WIDTH } from "../../constants/calendar.ts";
import { truncateLabel, formatHoursAsDuration } from "../../utils/calendar.ts";

export function DayCard({ day, hours, isSelected, isToday, status, labelText }: DayCardProps) {
  if (day === null) {
    return (
      <box
        flexGrow={1}
        flexBasis={0}
        flexDirection="column"
        borderStyle="single"
        borderColor="transparent"
      >
        <box flexDirection="row" justifyContent="space-between" paddingLeft={1} paddingRight={1}>
          <text> </text>
        </box>
        <box flexGrow={1} alignItems="center" justifyContent="center">
          <text> </text>
        </box>
      </box>
    );
  }

  const dayStr = String(day);
  const timeStr = hours > 0 ? formatHoursAsDuration(hours) : "";
  const star = isToday ? "*" : "";

  let borderColor = CALENDAR_COLORS.border;
  if (isSelected) {
    borderColor = CALENDAR_COLORS.selected;
  } else if (status === "hasHours") {
    borderColor = CALENDAR_COLORS.hasHours;
  } else if (status === "holiday") {
    borderColor = CALENDAR_COLORS.holiday;
  } else if (status === "timeOff") {
    borderColor = CALENDAR_COLORS.timeOff;
  } else if (status === "missing") {
    borderColor = CALENDAR_COLORS.missing;
  }

  const isWeekend = status === "weekend";

  const dayAttr = isWeekend 
    ? TextAttributes.DIM 
    : isSelected 
      ? TextAttributes.BOLD 
      : 0;

  let contentText = "";
  let contentAttr = TextAttributes.DIM;
  let secondaryText = "";

  if (status === "hasHours") {
    contentText = timeStr;
    contentAttr = TextAttributes.BOLD;
  } else if (status === "holiday") {
    contentText = truncateLabel(labelText ?? "Hol", DAY_CARD_CONTENT_WIDTH);
    contentAttr = TextAttributes.BOLD;
    if (hours > 0) {
      secondaryText = timeStr;
    }
  } else if (status === "timeOff") {
    contentText = truncateLabel(labelText ?? "PTO", DAY_CARD_CONTENT_WIDTH);
    contentAttr = 0;
  } else if (status === "missing") {
    contentText = "!";
    contentAttr = TextAttributes.BOLD;
  } else if (status === "weekend") {
    contentText = "";
  } else {
    contentText = "-";
  }

  return (
    <box
      flexGrow={1}
      flexBasis={0}
      flexDirection="column"
      borderStyle={isSelected ? "double" : "single"}
      borderColor={borderColor}
    >
      <box flexDirection="row" justifyContent="space-between" paddingLeft={1} paddingRight={1}>
        <text attributes={dayAttr}>{dayStr}</text>
        <text attributes={TextAttributes.BOLD}>{star}</text>
      </box>
      <box flexGrow={1} flexDirection="column" alignItems="center" justifyContent="center">
        <text attributes={contentAttr}>{contentText}</text>
        {secondaryText && <text attributes={TextAttributes.DIM}>{secondaryText}</text>}
      </box>
    </box>
  );
}
