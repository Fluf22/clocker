import { TextAttributes } from "@opentui/core";
import { memo } from "react";
import { KeyHint } from "../KeyHint.tsx";

export const InputStatusBar = memo(function InputStatusBar() {
  return (
    <>
      <KeyHint keyName="Type" action="Enter value" />
      <KeyHint keyName="Enter" action="Confirm" />
      <KeyHint keyName="Esc" action="Cancel" />
    </>
  );
});

interface ModalHeaderProps {
  title?: string;
}

export const ModalHeader = memo(function ModalHeader({ title = "Settings" }: ModalHeaderProps) {
  return (
    <box justifyContent="center" marginBottom={1}>
      <text attributes={TextAttributes.BOLD}>{title}</text>
    </box>
  );
});

export const ErrorDisplay = memo(function ErrorDisplay({ error }: { error: string }) {
  return (
    <box justifyContent="center" marginBottom={1}>
      <text attributes={TextAttributes.BOLD}>{error}</text>
    </box>
  );
});

export const ScheduleStatusBar = memo(function ScheduleStatusBar() {
  return (
    <>
      <KeyHint keyName="Arrows" action="Edit" />
      <KeyHint keyName="Tab" action="Next" />
      <KeyHint keyName="Enter" action="Save" />
    </>
  );
});

export const ConnectionsStatusBar = memo(function ConnectionsStatusBar() {
  return (
    <>
      <KeyHint keyName="↑/↓" action="Select" />
      <KeyHint keyName="Enter" action="Reconfigure" />
    </>
  );
});

export const TabSwitchHint = memo(function TabSwitchHint() {
  return <KeyHint keyName="</>" action="Switch tab" />;
});

export const SavingIndicator = memo(function SavingIndicator() {
  return (
    <box justifyContent="center">
      <text attributes={TextAttributes.DIM}>Saving...</text>
    </box>
  );
});

interface FutureMonthWarningProps {
  action?: "editing" | "submission";
}

export const FutureMonthWarning = memo(function FutureMonthWarning({ action = "editing" }: FutureMonthWarningProps) {
  return (
    <>
      <box justifyContent="center" marginBottom={1}>
        <text>Timesheet not open yet</text>
      </box>
      <box justifyContent="center" marginBottom={1}>
        <text attributes={TextAttributes.DIM}>This month's timesheet is not available for {action}.</text>
      </box>
      <box justifyContent="center">
        <KeyHint keyName="Esc" action="Close" />
      </box>
    </>
  );
});
