import { TextAttributes } from "@opentui/core";
import { memo } from "react";
import { MODAL_COLORS } from "../../constants/modalColors.ts";
import { padTime } from "../../utils/time.ts";

export const BlinkingCursor = memo(function BlinkingCursor({ char }: { char: string }) {
  return (
    <box backgroundColor={MODAL_COLORS.cursor}>
      <text attributes={TextAttributes.BOLD | TextAttributes.BLINK}>{char}</text>
    </box>
  );
});

export const TimeDigit = memo(function TimeDigit({ char, isBold }: { char: string; isBold: boolean }) {
  return <text attributes={isBold ? TextAttributes.BOLD : 0}>{char}</text>;
});

const CHAR_INDEX_MAP = [0, 1, 3, 4];

export const TimeField = memo(function TimeField({ 
  label, 
  value, 
  isActive, 
  cursorPosition 
}: { 
  label: string; 
  value: string; 
  isActive: boolean; 
  cursorPosition: number;
}) {
  const paddedValue = padTime(value);
  const chars = paddedValue.split("");

  return (
    <box flexDirection="row" justifyContent="space-between" gap={2}>
      <text attributes={isActive ? TextAttributes.BOLD : 0}>{label}</text>
      <box
        borderStyle="single"
        borderColor={isActive ? MODAL_COLORS.active : MODAL_COLORS.inactive}
        paddingLeft={1}
        paddingRight={1}
      >
        <box flexDirection="row">
          {chars.map((char, idx) => {
            const isColon = idx === 2;
            const digitPosition = CHAR_INDEX_MAP.indexOf(idx);
            const isCursor = isActive && digitPosition === cursorPosition;

            if (isColon) {
              return <TimeDigit key={idx} char=":" isBold={isActive} />;
            }

            if (isCursor) {
              return <BlinkingCursor key={idx} char={char} />;
            }

            return <TimeDigit key={idx} char={char} isBold={isActive} />;
          })}
        </box>
      </box>
    </box>
  );
});
