import type { Holiday, TimeOffRequest } from "../types/index.ts";

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function formatDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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
    const dateStr = formatDateStr(date);
    const isWorkingDay =
      !isWeekend(date) &&
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

export function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
