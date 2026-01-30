import { TextAttributes } from "@opentui/core";
import { memo, type ReactNode } from "react";

interface KeyHintProps {
  keyName: string;
  action: string;
}

export const KeyHint = memo(function KeyHint({
  keyName,
  action,
}: KeyHintProps) {
  return (
    <text attributes={TextAttributes.DIM}>
      [{keyName}] {action}
    </text>
  );
});

interface KeyHintBarProps {
  children: ReactNode;
  gap?: number;
}

export const KeyHintBar = memo(function KeyHintBar({
  children,
  gap = 2,
}: KeyHintBarProps) {
  return (
    <box justifyContent="center" gap={gap}>
      {children}
    </box>
  );
});
