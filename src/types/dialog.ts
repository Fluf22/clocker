import type { ReactNode } from "react";

export interface DialogShowOptions {
  content: () => ReactNode;
  closeOnEscape?: boolean;
  backdropOpacity?: number;
  id?: string;
  onClose?: () => void;
}

export interface DialogActions {
  show: (options: DialogShowOptions) => unknown;
  close: () => void;
}
