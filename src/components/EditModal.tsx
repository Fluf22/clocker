import { TextAttributes } from "@opentui/core";
import { memo } from "react";
import type { WorkSchedule } from "../types/index.ts";

export type EditField = "morningStart" | "morningEnd" | "afternoonStart" | "afternoonEnd";

interface EditModalProps {
  date: string;
  schedule: WorkSchedule;
  activeField: EditField;
  cursorPosition: number;
  saving: boolean;
  error: string | null;
  isFutureMonth: boolean;
}

const COLORS = {
  border: "#a78bfa",
  active: "#67e8f9",
  inactive: "#64748b",
  error: "#f87171",
  cursor: "#fbbf24",
  warning: "#fbbf24",
};

function padTime(value: string): string {
  const parts = value.split(":");
  const hours = (parts[0] ?? "00").padStart(2, "0");
  const minutes = (parts[1] ?? "00").padStart(2, "0");
  return `${hours}:${minutes}`;
}

const BlinkingCursor = memo(function BlinkingCursor({ char }: { char: string }) {
  return (
    <box backgroundColor={COLORS.cursor}>
      <text attributes={TextAttributes.BOLD | TextAttributes.BLINK}>{char}</text>
    </box>
  );
});

const TimeDigit = memo(function TimeDigit({ char, isBold }: { char: string; isBold: boolean }) {
  return <text attributes={isBold ? TextAttributes.BOLD : 0}>{char}</text>;
});

const CHAR_INDEX_MAP = [0, 1, 3, 4];

const TimeField = memo(function TimeField({ 
  label, 
  value, 
  isActive, 
  cursorPosition 
}: { 
  label: string; 
  value: string; 
  isActive: boolean; 
  cursorPosition: number;
}) {
  const paddedValue = padTime(value);
  const chars = paddedValue.split("");

  return (
    <box flexDirection="row" justifyContent="space-between" gap={2}>
      <text attributes={isActive ? TextAttributes.BOLD : 0}>{label}</text>
      <box
        borderStyle="single"
        borderColor={isActive ? COLORS.active : COLORS.inactive}
        paddingLeft={1}
        paddingRight={1}
      >
        <box flexDirection="row">
          {chars.map((char, idx) => {
            const isColon = idx === 2;
            const digitPosition = CHAR_INDEX_MAP.indexOf(idx);
            const isCursor = isActive && digitPosition === cursorPosition;

            if (isColon) {
              return <TimeDigit key={idx} char=":" isBold={isActive} />;
            }

            if (isCursor) {
              return <BlinkingCursor key={idx} char={char} />;
            }

            return <TimeDigit key={idx} char={char} isBold={isActive} />;
          })}
        </box>
      </box>
    </box>
  );
});

function calculateTotalHours(schedule: WorkSchedule): number {
  const parseTime = (time: string): number => {
    const padded = padTime(time);
    const hours = parseInt(padded.slice(0, 2), 10);
    const minutes = parseInt(padded.slice(3, 5), 10);
    return hours + minutes / 60;
  };

  const morningHours = Math.max(0, parseTime(schedule.morning.end) - parseTime(schedule.morning.start));
  const afternoonHours = Math.max(0, parseTime(schedule.afternoon.end) - parseTime(schedule.afternoon.start));
  
  return morningHours + afternoonHours;
}

function formatTotalHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h${m}m`;
}

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
      borderColor={isFutureMonth ? COLORS.warning : COLORS.border}
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

export function adjustTimeDigit(time: string, position: number, delta: number): string {
  const padded = padTime(time);
  const hours = parseInt(padded.slice(0, 2), 10);
  const minutes = parseInt(padded.slice(3, 5), 10);

  let newHours = hours;
  let newMinutes = minutes;

  switch (position) {
    case 0:
      newHours = adjustWithWrap(hours, delta * 10, 0, 23);
      break;
    case 1:
      newHours = adjustWithWrap(hours, delta, 0, 23);
      break;
    case 2:
      newMinutes = adjustWithWrap(minutes, delta * 10, 0, 59);
      break;
    case 3:
      newMinutes = adjustWithWrap(minutes, delta, 0, 59);
      break;
  }

  return `${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(2, "0")}`;
}

function adjustWithWrap(value: number, delta: number, min: number, max: number): number {
  let newValue = value + delta;
  if (newValue > max) newValue = min;
  if (newValue < min) newValue = max;
  return newValue;
}

export function getScheduleHours(schedule: WorkSchedule): number {
  return calculateTotalHours(schedule);
}

interface TimesheetEntry {
  type: "hour" | "clock";
  start?: string;
  end?: string;
  hours?: number;
}

export function extractScheduleFromEntries(
  entries: TimesheetEntry[],
  defaultSchedule: WorkSchedule
): WorkSchedule {
  const clockEntries = entries.filter(
    (e) => e.type === "clock" && e.start && e.end
  );

  if (clockEntries.length === 0) {
    return {
      morning: { ...defaultSchedule.morning },
      afternoon: { ...defaultSchedule.afternoon },
    };
  }

  const extractTime = (isoString: string): string => {
    const date = new Date(isoString);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const getHour = (isoString: string): number => {
    return new Date(isoString).getHours();
  };

  const morningEntries = clockEntries.filter((e) => getHour(e.end!) < 14);
  const afternoonEntries = clockEntries.filter((e) => getHour(e.start!) >= 12);

  let morningStart = defaultSchedule.morning.start;
  let morningEnd = defaultSchedule.morning.end;
  let afternoonStart = defaultSchedule.afternoon.start;
  let afternoonEnd = defaultSchedule.afternoon.end;

  if (morningEntries.length > 0) {
    const starts = morningEntries.map((e) => e.start!).sort();
    const ends = morningEntries.map((e) => e.end!).sort();
    morningStart = extractTime(starts[0]!);
    morningEnd = extractTime(ends[ends.length - 1]!);
  }

  if (afternoonEntries.length > 0) {
    const starts = afternoonEntries.map((e) => e.start!).sort();
    const ends = afternoonEntries.map((e) => e.end!).sort();
    afternoonStart = extractTime(starts[0]!);
    afternoonEnd = extractTime(ends[ends.length - 1]!);
  }

  return {
    morning: { start: morningStart, end: morningEnd },
    afternoon: { start: afternoonStart, end: afternoonEnd },
  };
}
