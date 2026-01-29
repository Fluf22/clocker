import { TextAttributes } from "@opentui/core";
import { DAY_NAMES, CALENDAR_COLORS } from "../../constants/calendar.ts";

interface CalendarHeaderProps {
  monthName: string;
  year: number;
}

export function CalendarHeader({ monthName, year }: CalendarHeaderProps) {
  return (
    <>
      <box
        flexDirection="row"
        justifyContent="space-between" 
        alignItems="center" 
        marginBottom={1}
        borderStyle="rounded" 
        borderColor={CALENDAR_COLORS.header} 
        paddingLeft={1} 
        paddingRight={1}
      >
        <text attributes={TextAttributes.DIM}>{"<"}</text>
        <text attributes={TextAttributes.BOLD}>{`${monthName} ${year}`}</text>
        <text attributes={TextAttributes.DIM}>{">"}</text>
      </box>

      <box flexDirection="row" height={1}>
        {DAY_NAMES.map((name, i) => (
          <box key={name} flexGrow={1} flexBasis={0} justifyContent="center">
            <text attributes={i >= 5 ? TextAttributes.DIM : 0}>{name}</text>
          </box>
        ))}
      </box>
    </>
  );
}
