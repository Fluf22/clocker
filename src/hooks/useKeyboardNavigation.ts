import { useEffect } from "react";
import type { CliRenderer } from "@opentui/core";

interface UseKeyboardNavigationParams {
  renderer: CliRenderer;
  isDialogOpen: boolean;
  navigateDay: (delta: number) => void;
  navigateWeek: (delta: number) => void;
  navigateMonth: (delta: number) => void;
  showDayModal: () => void;
  showEditModal: () => void;
  showBulkModal: () => void;
  showConfigModal: () => void;
}

export function useKeyboardNavigation({
  renderer,
  isDialogOpen,
  navigateDay,
  navigateWeek,
  navigateMonth,
  showDayModal,
  showEditModal,
  showBulkModal,
  showConfigModal,
}: UseKeyboardNavigationParams): void {
  useEffect(() => {
    const handler = (event: { name: string; ctrl: boolean; shift: boolean }) => {
      if (isDialogOpen) {
        if (event.name === "q") {
          renderer.destroy();
          process.exit(0);
        }
        return;
      }
      
      switch (event.name) {
        case "left":
          navigateDay(-1);
          break;
        case "right":
          navigateDay(1);
          break;
        case "up":
          navigateWeek(-1);
          break;
        case "down":
          navigateWeek(1);
          break;
        case "p":
        case "[":
          navigateMonth(-1);
          break;
        case "n":
        case "]":
          navigateMonth(1);
          break;
        case "return":
          showDayModal();
          break;
        case "e":
          showEditModal();
          break;
        case "s":
          showBulkModal();
          break;
        case "c":
          showConfigModal();
          break;
        case "q":
          renderer.destroy();
          process.exit(0);
          break;
      }
    };

    renderer.keyInput.on("keypress", handler);
    return () => {
      renderer.keyInput.off("keypress", handler);
    };
  }, [renderer, isDialogOpen, navigateDay, navigateWeek, navigateMonth, showDayModal, showEditModal, showBulkModal, showConfigModal]);
}
