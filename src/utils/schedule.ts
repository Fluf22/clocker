import type { WorkSchedule } from "../types/index.ts";
import type { ClockEntryLike } from "../types/editModal.ts";
import { padTime } from "./time.ts";

export function calculateTotalHours(schedule: WorkSchedule): number {
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

export function formatTotalHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h${m}m`;
}

export function getScheduleHours(schedule: WorkSchedule): number {
  return calculateTotalHours(schedule);
}

export function extractScheduleFromEntries(
  entries: ClockEntryLike[],
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
