import { TextAttributes } from "@opentui/core";
import type { TimesheetEntry } from "../types/index.ts";

interface DayModalProps {
  date: string;
  entries: TimesheetEntry[];
  dayType: "normal" | "timeOff" | "holiday";
  dayLabel?: string;
  onClose: () => void;
}

function formatHoursAsTime(hours: number | undefined): string {
  if (hours === undefined || hours === 0) return "-";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
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
        <text>  {formatHoursAsTime(entry.hours)} </text>
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

export function DayModal({ date, entries, dayType, dayLabel, onClose }: DayModalProps) {
  const displayDate = new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const totalHours = entries.reduce((sum, e) => sum + (e.hours ?? 0), 0);
  const isEditable = dayType === "normal";

  return (
    <box
      flexDirection="column"
      padding={1}
      borderStyle="rounded"
    >
      <box justifyContent="center" marginBottom={1}>
        <text attributes={TextAttributes.BOLD}>{displayDate}</text>
      </box>

      {dayType === "holiday" && (
        <box justifyContent="center" marginBottom={1}>
          <text attributes={TextAttributes.BOLD}>{dayLabel ?? "Holiday"}</text>
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
            <text attributes={TextAttributes.BOLD}>{`Total: ${formatHoursAsTime(totalHours)}`}</text>
          </box>
        </box>
      )}

      <box justifyContent="center" gap={2}>
        <text attributes={TextAttributes.DIM}>[Enter/Esc] Close</text>
        {isEditable && <text attributes={TextAttributes.DIM}>[E] Edit</text>}
      </box>
    </box>
  );
}
