import { useCallback, type MutableRefObject, type ReactNode } from "react";
import type { CliRenderer } from "@opentui/core";
import { BambooHRClient } from "../api/client.ts";
import { BulkSubmitModal } from "../components/BulkSubmitModal.tsx";
import { getScheduleHours } from "../components/EditModal.tsx";
import type { WorkSchedule } from "../types/index.ts";

interface BulkModalState {
  dialogOpen: boolean;
  saving: boolean;
  saveError: string | null;
  bulkProgress: number;
}

interface DialogActions {
  show: (options: { content: () => ReactNode; closeOnEscape?: boolean; backdropOpacity?: number; id?: string; onClose?: () => void }) => unknown;
  close: () => void;
}

interface UseShowBulkModalParams {
  dialog: DialogActions;
  renderer: CliRenderer;
  client: BambooHRClient;
  stateRef: MutableRefObject<BulkModalState>;
  year: number;
  month: number;
  workSchedule: WorkSchedule;
  getMissingDays: () => string[];
  refreshEntries: () => void;
}

export function useShowBulkModal({
  dialog,
  renderer,
  client,
  stateRef,
  year,
  month,
  workSchedule,
  getMissingDays,
  refreshEntries,
}: UseShowBulkModalParams): () => void {
  return useCallback(() => {
    if (stateRef.current.dialogOpen) return;
    stateRef.current.dialogOpen = true;
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const isFutureMonth = year > currentYear || (year === currentYear && month > currentMonth);
    
    const missingDays = getMissingDays();
    const hoursPerDay = getScheduleHours(workSchedule);
    
    stateRef.current.bulkProgress = 0;
    stateRef.current.saveError = null;
    stateRef.current.saving = false;
    
    let bulkHandlerRef: ((event: { name: string }) => void) | null = null;
    
    const cleanup = () => {
      if (bulkHandlerRef) {
        renderer.keyInput.off("keypress", bulkHandlerRef);
        bulkHandlerRef = null;
      }
      stateRef.current.dialogOpen = false;
      stateRef.current.saving = false;
    };
    
    const updateDialog = () => {
      dialog.show({
        content: () => (
          <BulkSubmitModal
            missingDays={missingDays}
            hours={hoursPerDay}
            saving={stateRef.current.saving}
            progress={stateRef.current.bulkProgress}
            error={stateRef.current.saveError}
            isFutureMonth={isFutureMonth}
          />
        ),
        closeOnEscape: !stateRef.current.saving,
        backdropOpacity: 0.6,
        id: "bulk-modal",
        onClose: cleanup,
      });
    };

    const bulkSubmit = async () => {
      stateRef.current.saving = true;
      stateRef.current.saveError = null;
      stateRef.current.bulkProgress = 0;
      updateDialog();

      const schedule = workSchedule;
      
      try {
        for (let i = 0; i < missingDays.length; i++) {
          const dateStr = missingDays[i];
          if (!dateStr) continue;
          
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
          
          stateRef.current.bulkProgress = i + 1;
          updateDialog();
        }
        refreshEntries();
        dialog.close();
      } catch (err) {
        stateRef.current.saveError = err instanceof Error ? err.message : "Bulk save failed";
        stateRef.current.saving = false;
        updateDialog();
      }
    };

    const bulkHandler = (event: { name: string }) => {
      if (event.name === "return" && !stateRef.current.saving && missingDays.length > 0 && !isFutureMonth) {
        bulkSubmit();
      }
    };
    
    bulkHandlerRef = bulkHandler;
    renderer.keyInput.on("keypress", bulkHandler);
    updateDialog();
  }, [dialog, renderer, client, stateRef, year, month, workSchedule, getMissingDays, refreshEntries]);
}
