import type { ScheduleField, WorkSchedule } from "../types/index.ts";
import { adjustTimeDigit } from "../utils/time.ts";

export interface TimeFieldNavigationConfig {
  getSchedule: () => WorkSchedule | null;
  setSchedule: (schedule: WorkSchedule) => void;
  getActiveField: () => ScheduleField;
  setActiveField: (field: ScheduleField) => void;
  getCursorPosition: () => number;
  setCursorPosition: (position: number) => void;
  onUpdate: () => void;
}

export const SCHEDULE_FIELDS: ScheduleField[] = [
  "morningStart",
  "morningEnd",
  "afternoonStart",
  "afternoonEnd",
];

function getFieldValue(schedule: WorkSchedule, field: ScheduleField): string {
  switch (field) {
    case "morningStart":
      return schedule.morning.start;
    case "morningEnd":
      return schedule.morning.end;
    case "afternoonStart":
      return schedule.afternoon.start;
    case "afternoonEnd":
      return schedule.afternoon.end;
  }
}

function setFieldValue(
  schedule: WorkSchedule,
  field: ScheduleField,
  value: string
): WorkSchedule {
  const newSchedule = { ...schedule };
  switch (field) {
    case "morningStart":
      newSchedule.morning = { ...schedule.morning, start: value };
      break;
    case "morningEnd":
      newSchedule.morning = { ...schedule.morning, end: value };
      break;
    case "afternoonStart":
      newSchedule.afternoon = { ...schedule.afternoon, start: value };
      break;
    case "afternoonEnd":
      newSchedule.afternoon = { ...schedule.afternoon, end: value };
      break;
  }
  return newSchedule;
}

export function useTimeFieldNavigation(config: TimeFieldNavigationConfig) {
  const handleTab = (shift: boolean) => {
    const currentIndex = SCHEDULE_FIELDS.indexOf(config.getActiveField());
    const nextIndex = shift
      ? (currentIndex - 1 + SCHEDULE_FIELDS.length) % SCHEDULE_FIELDS.length
      : (currentIndex + 1) % SCHEDULE_FIELDS.length;
    config.setActiveField(SCHEDULE_FIELDS[nextIndex] ?? "morningStart");
    config.setCursorPosition(0);
    config.onUpdate();
  };

  const handleLeft = () => {
    config.setCursorPosition(Math.max(0, config.getCursorPosition() - 1));
    config.onUpdate();
  };

  const handleRight = () => {
    config.setCursorPosition(Math.min(3, config.getCursorPosition() + 1));
    config.onUpdate();
  };

  const handleUp = () => {
    const schedule = config.getSchedule();
    if (!schedule) return;

    const currentValue = getFieldValue(schedule, config.getActiveField());
    const newValue = adjustTimeDigit(
      currentValue,
      config.getCursorPosition(),
      1
    );
    const newSchedule = setFieldValue(
      schedule,
      config.getActiveField(),
      newValue
    );
    config.setSchedule(newSchedule);
    config.onUpdate();
  };

  const handleDown = () => {
    const schedule = config.getSchedule();
    if (!schedule) return;

    const currentValue = getFieldValue(schedule, config.getActiveField());
    const newValue = adjustTimeDigit(
      currentValue,
      config.getCursorPosition(),
      -1
    );
    const newSchedule = setFieldValue(
      schedule,
      config.getActiveField(),
      newValue
    );
    config.setSchedule(newSchedule);
    config.onUpdate();
  };

  return {
    handleTab,
    handleLeft,
    handleRight,
    handleUp,
    handleDown,
  };
}
