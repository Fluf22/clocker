import type { Holiday, TimeOffRequest } from "../types/index.ts";
import { formatDateFromDate, isWeekendDate } from "./date.ts";

function isHoliday(dateStr: string, holidays: Holiday[]): boolean {
  return holidays.some((h) => dateStr >= h.start && dateStr <= h.end);
}

function isTimeOff(dateStr: string, timeOff: TimeOffRequest[]): boolean {
  return timeOff.some((t) => dateStr >= t.start && dateStr <= t.end);
}

export function getLastWorkingDay(
  year: number,
  month: number,
  holidays: Holiday[],
  timeOff: TimeOffRequest[]
): Date {
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const date = new Date(lastDayOfMonth);

  while (date.getMonth() === month) {
    const dateStr = formatDateFromDate(date);
    const isWorkingDay =
      !isWeekendDate(date) &&
      !isHoliday(dateStr, holidays) &&
      !isTimeOff(dateStr, timeOff);

    if (isWorkingDay) {
      return date;
    }

    date.setDate(date.getDate() - 1);
  }

  return lastDayOfMonth;
}

export function getMonthName(month: number): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[month] ?? "Unknown";
}

export function getNextMonth(year: number, month: number): { year: number; month: number } {
  if (month === 11) {
    return { year: year + 1, month: 0 };
  }
  return { year, month: month + 1 };
}

// Re-export formatDate from date.ts for backwards compatibility
export { formatDate } from "./date.ts";
