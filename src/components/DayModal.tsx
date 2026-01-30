import { TextAttributes } from "@opentui/core";
import type { TimesheetEntry } from "../types/index.ts";
import { formatHoursAsDuration } from "../utils/calendar.ts";
import { KeyHint, KeyHintBar } from "./KeyHint.tsx";

interface DayModalProps {
  date: string;
  entries: TimesheetEntry[];
  dayType: "normal" | "timeOff" | "holiday";
  dayLabel?: string;
  holidayNames?: string[];
  onClose: () => void;
}

function formatTime(isoString: string | undefined): string {
  if (!isoString) return "-";
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function EntryRow({ entry }: { entry: TimesheetEntry }) {
  if (entry.type === "hour") {
    return (
      <box>
        <text>  {formatHoursAsDuration(entry.hours)} </text>
        {entry.projectInfo && (
          <text attributes={TextAttributes.DIM}>({entry.projectInfo.name})</text>
        )}
        {entry.note && (
          <text attributes={TextAttributes.DIM}> - {entry.note}</text>
        )}
      </box>
    );
  }

  return (
    <box>
      <text>  {formatTime(entry.start)} - {formatTime(entry.end)} </text>
      {entry.projectInfo && (
        <text attributes={TextAttributes.DIM}>({entry.projectInfo.name})</text>
      )}
    </box>
  );
}

export function DayModal({ date, entries, dayType, dayLabel, holidayNames, onClose }: DayModalProps) {
  const displayDate = new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const totalHours = entries.reduce((sum, e) => sum + (e.hours ?? 0), 0);
  const isEditable = dayType !== "timeOff";

  return (
    <box
      flexDirection="column"
      padding={1}
      borderStyle="rounded"
    >
      <box justifyContent="center" marginBottom={1}>
        <text attributes={TextAttributes.BOLD}>{displayDate}</text>
      </box>

      {dayType === "holiday" && holidayNames && holidayNames.length > 0 && (
        <box flexDirection="column" marginBottom={1}>
          <text attributes={TextAttributes.DIM}>
            {holidayNames.length === 1 ? "Holiday:" : "Holidays:"}
          </text>
          {holidayNames.map((name, idx) => (
            <text key={idx} attributes={TextAttributes.BOLD}>  {name}</text>
          ))}
        </box>
      )}

      {dayType === "holiday" && entries.length > 0 && (
        <box flexDirection="column" marginBottom={1}>
          <text attributes={TextAttributes.DIM}>Time entries:</text>
          {entries.map((entry) => (
            <EntryRow key={entry.id} entry={entry} />
          ))}
          <box marginTop={1}>
            <text attributes={TextAttributes.BOLD}>{`Total: ${formatHoursAsDuration(totalHours)}`}</text>
          </box>
        </box>
      )}

      {dayType === "timeOff" && (
        <box justifyContent="center" marginBottom={1}>
          <text attributes={TextAttributes.BOLD}>{dayLabel ?? "Time Off"}</text>
        </box>
      )}

      {dayType === "normal" && entries.length === 0 ? (
        <box justifyContent="center" marginBottom={1}>
          <text attributes={TextAttributes.DIM}>No time entries for this day</text>
        </box>
      ) : dayType === "normal" && (
        <box flexDirection="column" marginBottom={1}>
          <text attributes={TextAttributes.DIM}>Entries:</text>
          {entries.map((entry) => (
            <EntryRow key={entry.id} entry={entry} />
          ))}
          <box marginTop={1}>
            <text attributes={TextAttributes.BOLD}>{`Total: ${formatHoursAsDuration(totalHours)}`}</text>
          </box>
        </box>
      )}

       <KeyHintBar>
         <KeyHint keyName="Enter/Esc" action="Close" />
         {isEditable && <KeyHint keyName="E" action="Edit" />}
       </KeyHintBar>
    </box>
  );
}
