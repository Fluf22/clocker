import type { DayStatus } from "../types/calendar.ts";
import { getDaysInMonth, formatDate } from "./date.ts";

export { getDaysInMonth };

export { formatDate as formatCalendarDate };

export function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

export function getMonthName(month: number): string {
  return new Date(2000, month, 1).toLocaleString("en-US", { month: "long" });
}

export function truncateLabel(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1) + "…";
}

export function formatHoursAsDuration(hours: number | undefined): string {
  if (hours === undefined || hours === 0) return "-";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h${m}m`;
}

export function buildWeeksGrid(daysInMonth: number, firstDay: number): (number | null)[][] {
  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = [];

  for (let i = 0; i < firstDay; i++) {
    currentWeek.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  return weeks;
}

export function getDayStatus(
  day: number,
  dayIndex: number,
  dateStr: string,
  holidayByDate: Map<string, string[]>,
  timeOffByDate: Map<string, string>,
  hoursByDate: Map<string, number>,
  today: Date,
  year: number,
  month: number
): DayStatus {
  const isWeekend = dayIndex >= 5;
  if (isWeekend) return "weekend";

  if ((holidayByDate.get(dateStr)?.length ?? 0) > 0) return "holiday";
  if (timeOffByDate.has(dateStr)) return "timeOff";

  const hours = hoursByDate.get(dateStr) ?? 0;
  if (hours > 0) return "hasHours";

  const date = new Date(year, month, day);
  if (date > today) return "future";

  return "missing";
}

export function getLabelForDate(
  dateStr: string,
  holidayByDate: Map<string, string[]>,
  timeOffByDate: Map<string, string>
): string | undefined {
  const holidays = holidayByDate.get(dateStr) ?? [];
  if (holidays.length > 1) {
    return `${holidays.length} holidays`;
  }
  if (holidays.length === 1) {
    return holidays[0];
  }
  return timeOffByDate.get(dateStr);
}
