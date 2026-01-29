import { useCallback } from "react";
import { formatDate, isWeekend } from "../utils/date.ts";
import type { TimesheetEntry, TimeOffRequest, Holiday } from "../types/index.ts";

export interface DayInfo {
  type: "normal" | "timeOff" | "holiday";
  label?: string;
  holidayNames?: string[];
}

interface UseDayInfoResult {
  getMissingDays: () => string[];
  getDayInfo: (dateStr: string) => DayInfo;
}

export function useDayInfo(
  entries: TimesheetEntry[],
  timeOff: TimeOffRequest[],
  holidays: Holiday[],
  year: number,
  month: number,
  daysInMonth: number
): UseDayInfoResult {
  const getMissingDays = useCallback((): string[] => {
    const hoursByDate = new Map<string, number>();
    for (const entry of entries) {
      const existing = hoursByDate.get(entry.date) ?? 0;
      hoursByDate.set(entry.date, existing + (entry.hours ?? 0));
    }

    const timeOffDates = new Set<string>();
    for (const request of timeOff) {
      if (request.dates) {
        for (const dateStr of Object.keys(request.dates)) {
          timeOffDates.add(dateStr);
        }
      }
    }

    const holidayDates = new Set<string>();
    for (const holiday of holidays) {
      const startDate = new Date(holiday.start);
      const endDate = new Date(holiday.end);
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0] ?? "";
        holidayDates.add(dateStr);
      }
    }

    const missing: string[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      if (isWeekend(year, month, day)) continue;
      
      const dateStr = formatDate(year, month, day);
      
      if (holidayDates.has(dateStr)) continue;
      if (timeOffDates.has(dateStr)) continue;
      if ((hoursByDate.get(dateStr) ?? 0) > 0) continue;
      
      missing.push(dateStr);
    }
    return missing;
  }, [entries, timeOff, holidays, year, month, daysInMonth]);

  const getDayInfo = useCallback((dateStr: string): DayInfo => {
    const holidayNames: string[] = [];
    for (const holiday of holidays) {
      const startDate = new Date(holiday.start);
      const endDate = new Date(holiday.end);
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        if (d.toISOString().split("T")[0] === dateStr) {
          holidayNames.push(holiday.name);
        }
      }
    }
    
    if (holidayNames.length > 0) {
      return { type: "holiday", holidayNames };
    }
    
    for (const request of timeOff) {
      if (request.dates && dateStr in request.dates) {
        return { type: "timeOff", label: request.type?.name ?? request.name ?? "Time Off" };
      }
    }
    
    return { type: "normal" };
  }, [holidays, timeOff]);

  return {
    getMissingDays,
    getDayInfo,
  };
}
