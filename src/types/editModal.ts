import type { WorkSchedule, ScheduleField } from "./index.ts";

export type EditField = ScheduleField;

export interface EditModalProps {
  date: string;
  schedule: WorkSchedule;
  activeField: EditField;
  cursorPosition: number;
  saving: boolean;
  error: string | null;
  isFutureMonth: boolean;
}

export interface ClockEntryLike {
  type: "hour" | "clock";
  start?: string;
  end?: string;
  hours?: number;
}
