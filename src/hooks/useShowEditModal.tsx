import { useCallback, useRef, type MutableRefObject } from "react";
import type { CliRenderer } from "@opentui/core";
import { BambooHRClient } from "../api/client.ts";
import { EditModal, adjustTimeDigit, getScheduleHours, extractScheduleFromEntries, type EditField } from "../components/EditModal.tsx";
import { formatDate, isFutureMonth } from "../utils/date.ts";
import type { DayInfo } from "./useDayInfo.ts";
import type { TimesheetEntry, WorkSchedule } from "../types/index.ts";
import type { DialogActions } from "../types/dialog.ts";
import { useTimeFieldNavigation, SCHEDULE_FIELDS } from "./useTimeFieldNavigation.ts";

interface EditModalState {
  dialogOpen: boolean;
  saving: boolean;
  saveError: string | null;
  editSchedule: WorkSchedule | null;
  editActiveField: EditField;
  editCursorPosition: number;
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
    
    const isMonthInFuture = isFutureMonth(year, month);
    
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
            isFutureMonth={isMonthInFuture}
          />
        ),
        closeOnEscape: !stateRef.current.saving,
        backdropOpacity: 0.6,
        id: "edit-modal",
        onClose: cleanup,
      });
    };

    const navigation = useTimeFieldNavigation({
      getSchedule: () => stateRef.current.editSchedule,
      setSchedule: (schedule) => { stateRef.current.editSchedule = schedule; },
      getActiveField: () => stateRef.current.editActiveField,
      setActiveField: (field) => { stateRef.current.editActiveField = field; },
      getCursorPosition: () => stateRef.current.editCursorPosition,
      setCursorPosition: (pos) => { stateRef.current.editCursorPosition = pos; },
      onUpdate: updateDialog,
    });

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
      if (isMonthInFuture) return;
      
      if (event.name === "return") {
        saveClockEntries();
        return;
      }
      
      if (event.name === "tab") {
        navigation.handleTab(event.shift ?? false);
        return;
      }
      
      if (event.name === "left") {
        navigation.handleLeft();
        return;
      }
      
      if (event.name === "right") {
        navigation.handleRight();
        return;
      }
      
      if (event.name === "up") {
        navigation.handleUp();
        return;
      }
      
      if (event.name === "down") {
        navigation.handleDown();
        return;
      }
    };
    
    editHandlerRef = editHandler;
    renderer.keyInput.on("keypress", editHandler);
    updateDialog();
    
  }, [dialog, renderer, client, stateRef, year, month, selectedDay, entries, workSchedule, getDayInfo, refreshEntries]);
}
