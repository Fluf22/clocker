import { TextAttributes } from "@opentui/core";
import { useState, useEffect, memo } from "react";
import type { WorkSchedule } from "../types/index.ts";

interface ConfigModalProps {
  schedule: WorkSchedule;
  activeField: ConfigField;
  cursorPosition: number;
  saving: boolean;
  error: string | null;
}

export type ConfigField = "morningStart" | "morningEnd" | "afternoonStart" | "afternoonEnd";

const COLORS = {
  border: "#a78bfa",
  active: "#67e8f9",
  inactive: "#64748b",
  error: "#f87171",
  cursor: "#fbbf24",
};

function padTime(value: string): string {
  const parts = value.split(":");
  const hours = (parts[0] ?? "00").padStart(2, "0");
  const minutes = (parts[1] ?? "00").padStart(2, "0");
  return `${hours}:${minutes}`;
}

interface BlinkingCursorProps {
  char: string;
}

function BlinkingCursor({ char }: BlinkingCursorProps) {
  const [blinkOn, setBlinkOn] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setBlinkOn((prev) => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <box backgroundColor={blinkOn ? COLORS.cursor : undefined}>
      <text attributes={TextAttributes.BOLD}>{char}</text>
    </box>
  );
}

interface TimeDigitProps {
  char: string;
  isBold: boolean;
}

const TimeDigit = memo(function TimeDigit({ char, isBold }: TimeDigitProps) {
  return <text attributes={isBold ? TextAttributes.BOLD : 0}>{char}</text>;
});

interface TimeFieldProps {
  label: string;
  value: string;
  isActive: boolean;
  cursorPosition: number;
}

const CHAR_INDEX_MAP = [0, 1, 3, 4];

const TimeField = memo(function TimeField({ label, value, isActive, cursorPosition }: TimeFieldProps) {
  const paddedValue = padTime(value);
  const chars = paddedValue.split("");

  return (
    <box flexDirection="row" justifyContent="space-between" gap={2}>
      <text attributes={isActive ? TextAttributes.BOLD : 0}>{label}</text>
      <box
        borderStyle="single"
        borderColor={isActive ? COLORS.active : COLORS.inactive}
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

const ModalHeader = memo(function ModalHeader() {
  return (
    <box justifyContent="center" marginBottom={1}>
      <text attributes={TextAttributes.BOLD}>Work Schedule Settings</text>
    </box>
  );
});

interface ErrorDisplayProps {
  error: string;
}

const ErrorDisplay = memo(function ErrorDisplay({ error }: ErrorDisplayProps) {
  return (
    <box justifyContent="center" marginBottom={1}>
      <text attributes={TextAttributes.BOLD}>{error}</text>
    </box>
  );
});

const SectionLabel = memo(function SectionLabel({ label }: { label: string }) {
  return (
    <box marginBottom={1}>
      <text attributes={TextAttributes.DIM}>{label}</text>
    </box>
  );
});

const StatusBar = memo(function StatusBar({ saving }: { saving: boolean }) {
  if (saving) {
    return (
      <box justifyContent="center">
        <text attributes={TextAttributes.DIM}>Saving...</text>
      </box>
    );
  }

  return (
    <box justifyContent="center" gap={2}>
      <text attributes={TextAttributes.DIM}>[Arrows] Edit</text>
      <text attributes={TextAttributes.DIM}>[Tab] Next field</text>
      <text attributes={TextAttributes.DIM}>[Enter] Save</text>
    </box>
  );
});

export function ConfigModal({ schedule, activeField, cursorPosition, saving, error }: ConfigModalProps) {
  return (
    <box
      flexDirection="column"
      padding={1}
      borderStyle="rounded"
      borderColor={COLORS.border}
      minWidth={40}
    >
      <ModalHeader />

      {error && <ErrorDisplay error={error} />}

      <box flexDirection="column" gap={1} marginBottom={1}>
        <SectionLabel label="Morning" />
        <TimeField
          label="  Start"
          value={schedule.morning.start}
          isActive={activeField === "morningStart"}
          cursorPosition={cursorPosition}
        />
        <TimeField
          label="  End"
          value={schedule.morning.end}
          isActive={activeField === "morningEnd"}
          cursorPosition={cursorPosition}
        />
      </box>

      <box flexDirection="column" gap={1} marginBottom={1}>
        <SectionLabel label="Afternoon" />
        <TimeField
          label="  Start"
          value={schedule.afternoon.start}
          isActive={activeField === "afternoonStart"}
          cursorPosition={cursorPosition}
        />
        <TimeField
          label="  End"
          value={schedule.afternoon.end}
          isActive={activeField === "afternoonEnd"}
          cursorPosition={cursorPosition}
        />
      </box>

      <StatusBar saving={saving} />
    </box>
  );
}

export function adjustTimeDigit(time: string, position: number, delta: number): string {
  const padded = padTime(time);
  const hours = parseInt(padded.slice(0, 2), 10);
  const minutes = parseInt(padded.slice(3, 5), 10);

  let newHours = hours;
  let newMinutes = minutes;

  switch (position) {
    case 0:
      newHours = adjustWithWrap(hours, delta * 10, 0, 23);
      break;
    case 1:
      newHours = adjustWithWrap(hours, delta, 0, 23);
      break;
    case 2:
      newMinutes = adjustWithWrap(minutes, delta * 10, 0, 59);
      break;
    case 3:
      newMinutes = adjustWithWrap(minutes, delta, 0, 59);
      break;
  }

  return `${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(2, "0")}`;
}

function adjustWithWrap(value: number, delta: number, min: number, max: number): number {
  let newValue = value + delta;
  if (newValue > max) newValue = min;
  if (newValue < min) newValue = max;
  return newValue;
}
