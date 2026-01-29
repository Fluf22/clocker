import { useCallback, useRef, type MutableRefObject, type ReactNode } from "react";
import type { CliRenderer } from "@opentui/core";
import { DayModal } from "../components/DayModal.tsx";
import { formatDate } from "../utils/date.ts";
import type { DayInfo } from "./useDayInfo.ts";
import type { TimesheetEntry } from "../types/index.ts";

interface DialogState {
  dialogOpen: boolean;
}

interface DialogActions {
  show: (options: { content: () => ReactNode; closeOnEscape?: boolean; backdropOpacity?: number; id?: string; onClose?: () => void }) => unknown;
  close: () => void;
}

interface UseShowDayModalParams {
  dialog: DialogActions;
  renderer: CliRenderer;
  stateRef: MutableRefObject<DialogState>;
  year: number;
  month: number;
  selectedDay: number;
  entries: TimesheetEntry[];
  getDayInfo: (dateStr: string) => DayInfo;
  onEditRequested: () => void;
}

export function useShowDayModal({
  dialog,
  renderer,
  stateRef,
  year,
  month,
  selectedDay,
  entries,
  getDayInfo,
  onEditRequested,
}: UseShowDayModalParams): () => void {
  const showEditModalRef = useRef<(() => void) | null>(null);
  showEditModalRef.current = onEditRequested;

  return useCallback(() => {
    if (stateRef.current.dialogOpen) return;
    stateRef.current.dialogOpen = true;
    
    const dateStr = formatDate(year, month, selectedDay);
    const dayEntries = entries.filter((e) => e.date === dateStr);
    const dayInfo = getDayInfo(dateStr);
    
    let dayModalHandlerRef: ((event: { name: string }) => void) | null = null;
    let openEditAfterClose = false;
    
    const cleanup = () => {
      if (dayModalHandlerRef) {
        renderer.keyInput.off("keypress", dayModalHandlerRef);
        dayModalHandlerRef = null;
      }
      stateRef.current.dialogOpen = false;
      
      if (openEditAfterClose && dayInfo.type !== "timeOff") {
        setTimeout(() => showEditModalRef.current?.(), 0);
      }
    };
    
    const dayModalHandler = (event: { name: string }) => {
      if (event.name === "return") {
        dialog.close();
      } else if (event.name === "e" && dayInfo.type !== "timeOff") {
        openEditAfterClose = true;
        dialog.close();
      }
    };
    
    dayModalHandlerRef = dayModalHandler;
    renderer.keyInput.on("keypress", dayModalHandler);
    
    dialog.show({
      content: () => (
        <DayModal
          date={dateStr}
          entries={dayEntries}
          dayType={dayInfo.type}
          dayLabel={dayInfo.label}
          holidayNames={dayInfo.holidayNames}
          onClose={() => dialog.close()}
        />
      ),
      closeOnEscape: true,
      backdropOpacity: 0.6,
      id: "day-modal",
      onClose: cleanup,
    });
  }, [dialog, renderer, stateRef, year, month, selectedDay, entries, getDayInfo]);
}
