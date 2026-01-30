export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function formatDate(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

export function formatDateFromDate(date: Date): string {
  return formatDate(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isWeekend(year: number, month: number, day: number): boolean {
  const dayOfWeek = new Date(year, month, day).getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
}

export function isWeekendDate(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function findNextWeekday(year: number, month: number, day: number, delta: number, daysInMonth: number): number {
  let next = day + delta;
  while (next >= 1 && next <= daysInMonth && isWeekend(year, month, next)) {
    next += delta;
  }
  if (next < 1 || next > daysInMonth) return day;
  return next;
}

export function getInitialWeekday(year: number, month: number, day: number): number {
  const daysInMonth = getDaysInMonth(year, month);
  let d = day;
  while (d <= daysInMonth && isWeekend(year, month, d)) {
    d++;
  }
  if (d > daysInMonth) {
    d = day;
    while (d >= 1 && isWeekend(year, month, d)) {
      d--;
    }
  }
  return Math.max(1, d);
}

export function isFutureMonth(year: number, month: number): boolean {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  return year > currentYear || (year === currentYear && month > currentMonth);
}
