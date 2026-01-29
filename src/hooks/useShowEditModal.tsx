import { useCallback, useRef, type MutableRefObject, type ReactNode } from "react";
import type { CliRenderer } from "@opentui/core";
import { BambooHRClient } from "../api/client.ts";
import { EditModal, adjustTimeDigit, getScheduleHours, extractScheduleFromEntries, type EditField } from "../components/EditModal.tsx";
import { formatDate } from "../utils/date.ts";
import type { DayInfo } from "./useDayInfo.ts";
import type { TimesheetEntry, WorkSchedule } from "../types/index.ts";

interface EditModalState {
  dialogOpen: boolean;
  saving: boolean;
  saveError: string | null;
  editSchedule: WorkSchedule | null;
  editActiveField: EditField;
  editCursorPosition: number;
}

interface DialogActions {
  show: (options: { content: () => ReactNode; closeOnEscape?: boolean; backdropOpacity?: number; id?: string; onClose?: () => void }) => unknown;
  close: () => void;
}

interface UseShowEditModalParams {
  dialog: DialogActions;
  renderer: CliRenderer;
  client: BambooHRClient;
  stateRef: MutableRefObject<EditModalState>;
  year: number;
  month: number;
  selectedDay: number;
  entries: TimesheetEntry[];
  workSchedule: WorkSchedule;
  getDayInfo: (dateStr: string) => DayInfo;
  refreshEntries: () => void;
  showDayModal: () => void;
}

export function useShowEditModal({
  dialog,
  renderer,
  client,
  stateRef,
  year,
  month,
  selectedDay,
  entries,
  workSchedule,
  getDayInfo,
  refreshEntries,
  showDayModal,
}: UseShowEditModalParams): () => void {
  const showDayModalRef = useRef<(() => void) | null>(null);
  showDayModalRef.current = showDayModal;

  return useCallback(() => {
    if (stateRef.current.dialogOpen) return;
    
    const dateStr = formatDate(year, month, selectedDay);
    const dayInfo = getDayInfo(dateStr);
    if (dayInfo.type === "timeOff" || dayInfo.type === "holiday") {
      showDayModalRef.current?.();
      return;
    }
    
    stateRef.current.dialogOpen = true;
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const isFutureMonth = year > currentYear || (year === currentYear && month > currentMonth);
    
    const dayEntries = entries.filter((e) => e.date === dateStr);
    stateRef.current.editSchedule = extractScheduleFromEntries(dayEntries, workSchedule);
    stateRef.current.editActiveField = "morningStart";
    stateRef.current.editCursorPosition = 0;
    stateRef.current.saveError = null;
    stateRef.current.saving = false;
    
    let editHandlerRef: ((event: { name: string; shift?: boolean }) => void) | null = null;
    
    const cleanup = () => {
      if (editHandlerRef) {
        renderer.keyInput.off("keypress", editHandlerRef);
        editHandlerRef = null;
      }
      stateRef.current.dialogOpen = false;
      stateRef.current.saving = false;
    };
    
    const updateDialog = () => {
      if (!stateRef.current.editSchedule) return;
      dialog.show({
        content: () => (
          <EditModal
            date={dateStr}
            schedule={stateRef.current.editSchedule!}
            activeField={stateRef.current.editActiveField}
            cursorPosition={stateRef.current.editCursorPosition}
            saving={stateRef.current.saving}
            error={stateRef.current.saveError}
            isFutureMonth={isFutureMonth}
          />
        ),
        closeOnEscape: !stateRef.current.saving,
        backdropOpacity: 0.6,
        id: "edit-modal",
        onClose: cleanup,
      });
    };

    const fields: EditField[] = ["morningStart", "morningEnd", "afternoonStart", "afternoonEnd"];
    
    const getFieldValue = (field: EditField): string => {
      if (!stateRef.current.editSchedule) return "00:00";
      switch (field) {
        case "morningStart": return stateRef.current.editSchedule.morning.start;
        case "morningEnd": return stateRef.current.editSchedule.morning.end;
        case "afternoonStart": return stateRef.current.editSchedule.afternoon.start;
        case "afternoonEnd": return stateRef.current.editSchedule.afternoon.end;
      }
    };
    
    const setFieldValue = (field: EditField, value: string) => {
      if (!stateRef.current.editSchedule) return;
      switch (field) {
        case "morningStart":
          stateRef.current.editSchedule.morning.start = value;
          break;
        case "morningEnd":
          stateRef.current.editSchedule.morning.end = value;
          break;
        case "afternoonStart":
          stateRef.current.editSchedule.afternoon.start = value;
          break;
        case "afternoonEnd":
          stateRef.current.editSchedule.afternoon.end = value;
          break;
      }
    };

    const saveClockEntries = async () => {
      if (!stateRef.current.editSchedule) return;
      
      const schedule = stateRef.current.editSchedule;
      const hours = getScheduleHours(schedule);
      if (hours < 0 || hours > 24) {
        stateRef.current.saveError = "Invalid hours (0-24)";
        updateDialog();
        return;
      }
      
      stateRef.current.saving = true;
      stateRef.current.saveError = null;
      updateDialog();
      
      try {
        await client.storeClockEntry({
          date: dateStr,
          start: schedule.morning.start,
          end: schedule.morning.end,
        });
        await client.storeClockEntry({
          date: dateStr,
          start: schedule.afternoon.start,
          end: schedule.afternoon.end,
        });
        
        refreshEntries();
        dialog.close();
      } catch (err) {
        stateRef.current.saveError = err instanceof Error ? err.message : "Save failed";
        stateRef.current.saving = false;
        updateDialog();
      }
    };

    const editHandler = (event: { name: string; shift?: boolean }) => {
      if (stateRef.current.saving) return;
      if (isFutureMonth) return;
      
      if (event.name === "return") {
        saveClockEntries();
        return;
      }
      
      if (event.name === "tab") {
        const currentIndex = fields.indexOf(stateRef.current.editActiveField);
        const nextIndex = event.shift 
          ? (currentIndex - 1 + fields.length) % fields.length
          : (currentIndex + 1) % fields.length;
        stateRef.current.editActiveField = fields[nextIndex] ?? "morningStart";
        stateRef.current.editCursorPosition = 0;
        updateDialog();
        return;
      }
      
      if (event.name === "left") {
        stateRef.current.editCursorPosition = Math.max(0, stateRef.current.editCursorPosition - 1);
        updateDialog();
        return;
      }
      
      if (event.name === "right") {
        stateRef.current.editCursorPosition = Math.min(3, stateRef.current.editCursorPosition + 1);
        updateDialog();
        return;
      }
      
      if (event.name === "up") {
        const currentValue = getFieldValue(stateRef.current.editActiveField);
        const newValue = adjustTimeDigit(currentValue, stateRef.current.editCursorPosition, 1);
        setFieldValue(stateRef.current.editActiveField, newValue);
        updateDialog();
        return;
      }
      
      if (event.name === "down") {
        const currentValue = getFieldValue(stateRef.current.editActiveField);
        const newValue = adjustTimeDigit(currentValue, stateRef.current.editCursorPosition, -1);
        setFieldValue(stateRef.current.editActiveField, newValue);
        updateDialog();
        return;
      }
    };
    
    editHandlerRef = editHandler;
    renderer.keyInput.on("keypress", editHandler);
    updateDialog();
    
  }, [dialog, renderer, client, stateRef, year, month, selectedDay, entries, workSchedule, getDayInfo, refreshEntries]);
}
