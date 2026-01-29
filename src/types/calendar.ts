import type { TimesheetEntry, TimeOffRequest, Holiday } from "./index.ts";

export interface CalendarProps {
  year: number;
  month: number;
  entries: TimesheetEntry[];
  timeOff: TimeOffRequest[];
  holidays: Holiday[];
  selectedDay: number | null;
  loading?: boolean;
}

export type DayStatus = "weekend" | "timeOff" | "holiday" | "hasHours" | "missing" | "future";

export interface DayCardProps {
  day: number | null;
  hours: number;
  isSelected: boolean;
  isToday: boolean;
  status: DayStatus;
  labelText?: string;
}
