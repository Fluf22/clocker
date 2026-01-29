import { TextAttributes } from "@opentui/core";
import type { CalendarProps } from "../types/calendar.ts";
import {
  getDaysInMonth,
  getFirstDayOfMonth,
  getMonthName,
  formatCalendarDate,
  buildWeeksGrid,
  getDayStatus,
  getLabelForDate,
} from "../utils/calendar.ts";
import { DayCard, CalendarHeader, CalendarLegend } from "./calendar/index.ts";

export function Calendar({ year, month, entries, timeOff, holidays, selectedDay, loading }: CalendarProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthName = getMonthName(month);
  const today = new Date();

  const hoursByDate = new Map<string, number>();
  for (const entry of entries) {
    const existing = hoursByDate.get(entry.date) ?? 0;
    hoursByDate.set(entry.date, existing + (entry.hours ?? 0));
  }

  const timeOffByDate = new Map<string, string>();
  for (const request of timeOff) {
    if (request.dates) {
      for (const dateStr of Object.keys(request.dates)) {
        timeOffByDate.set(dateStr, request.type?.name ?? request.name ?? "PTO");
      }
    }
  }

  const holidayByDate = new Map<string, string[]>();
  for (const holiday of holidays) {
    const startDate = new Date(holiday.start);
    const endDate = new Date(holiday.end);
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0] ?? "";
      const existing = holidayByDate.get(dateStr) ?? [];
      existing.push(holiday.name);
      holidayByDate.set(dateStr, existing);
    }
  }

  const weeks = buildWeeksGrid(daysInMonth, firstDay);

  if (loading) {
    return (
      <box flexDirection="column" flexGrow={1}>
        <box justifyContent="center" marginBottom={1}>
          <text attributes={TextAttributes.BOLD}>{`< ${monthName} ${year} >`}</text>
        </box>
        <box flexGrow={1} alignItems="center" justifyContent="center">
          <text attributes={TextAttributes.DIM}>Loading...</text>
        </box>
      </box>
    );
  }

  return (
    <box flexDirection="column" flexGrow={1}>
      <CalendarHeader monthName={monthName} year={year} />

      <box flexDirection="column" flexGrow={1}>
        {weeks.map((week, weekIndex) => (
          <box key={weekIndex} flexDirection="row" flexGrow={1} justifyContent="center">
            {week.map((day, dayIndex) => {
              const dateStr = day ? formatCalendarDate(year, month, day) : "";
              const hours = day ? (hoursByDate.get(dateStr) ?? 0) : 0;
              const isSelected = day === selectedDay;
              const isToday = day !== null && 
                year === today.getFullYear() && 
                month === today.getMonth() && 
                day === today.getDate();
              const status = day 
                ? getDayStatus(day, dayIndex, dateStr, holidayByDate, timeOffByDate, hoursByDate, today, year, month) 
                : "weekend";
              const labelText = day ? getLabelForDate(dateStr, holidayByDate, timeOffByDate) : undefined;

              return (
                <DayCard
                  key={dayIndex}
                  day={day}
                  hours={hours}
                  isSelected={isSelected}
                  isToday={isToday}
                  status={status}
                  labelText={labelText}
                />
              );
            })}
          </box>
        ))}
      </box>

      <CalendarLegend />
    </box>
  );
}
