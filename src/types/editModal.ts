import type { WorkSchedule } from "./index.ts";

export type EditField = "morningStart" | "morningEnd" | "afternoonStart" | "afternoonEnd";

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
