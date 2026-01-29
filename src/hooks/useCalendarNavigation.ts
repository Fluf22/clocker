import { useState, useCallback } from "react";
import { getDaysInMonth, isWeekend, findNextWeekday, getInitialWeekday } from "../utils/date.ts";

interface UseCalendarNavigationResult {
  year: number;
  month: number;
  selectedDay: number;
  daysInMonth: number;
  navigateDay: (delta: number) => void;
  navigateWeek: (delta: number) => void;
  navigateMonth: (delta: number) => void;
}

export function useCalendarNavigation(): UseCalendarNavigationResult {
  const now = new Date();
  const initialYear = now.getFullYear();
  const initialMonth = now.getMonth();
  const initialDay = getInitialWeekday(initialYear, initialMonth, now.getDate());

  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [selectedDay, setSelectedDay] = useState<number>(initialDay);

  const daysInMonth = getDaysInMonth(year, month);

  const navigateDay = useCallback((delta: number) => {
    setSelectedDay((prev) => findNextWeekday(year, month, prev, delta, daysInMonth));
  }, [year, month, daysInMonth]);

  const navigateWeek = useCallback((delta: number) => {
    setSelectedDay((prev) => {
      let next = prev + delta * 7;
      if (next < 1) next = Math.max(1, next + daysInMonth);
      if (next > daysInMonth) next = Math.min(daysInMonth, next - daysInMonth);
      while (next >= 1 && next <= daysInMonth && isWeekend(year, month, next)) {
        next += delta > 0 ? 1 : -1;
      }
      if (next < 1 || next > daysInMonth) return prev;
      return next;
    });
  }, [year, month, daysInMonth]);

  const navigateMonth = useCallback((delta: number) => {
    let newYear = year;
    let newMonth = month + delta;
    if (newMonth < 0) {
      newYear -= 1;
      newMonth = 11;
    } else if (newMonth > 11) {
      newYear += 1;
      newMonth = 0;
    }
    
    if (newYear < 2026 || (newYear === 2026 && newMonth < 0)) {
      return;
    }
    
    const newDaysInMonth = getDaysInMonth(newYear, newMonth);
    let firstWeekday = 1;
    while (firstWeekday <= newDaysInMonth && isWeekend(newYear, newMonth, firstWeekday)) {
      firstWeekday++;
    }
    setYear(newYear);
    setMonth(newMonth);
    setSelectedDay(firstWeekday);
  }, [year, month]);

  return {
    year,
    month,
    selectedDay,
    daysInMonth,
    navigateDay,
    navigateWeek,
    navigateMonth,
  };
}
