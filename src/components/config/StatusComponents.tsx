import { TextAttributes } from "@opentui/core";
import { memo } from "react";

export const InputStatusBar = memo(function InputStatusBar() {
  return (
    <>
      <text attributes={TextAttributes.DIM}>[Type] Enter value</text>
      <text attributes={TextAttributes.DIM}>[Enter] Confirm</text>
      <text attributes={TextAttributes.DIM}>[Esc] Cancel</text>
    </>
  );
});

export const ModalHeader = memo(function ModalHeader() {
  return (
    <box justifyContent="center" marginBottom={1}>
      <text attributes={TextAttributes.BOLD}>Settings</text>
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
      <text attributes={TextAttributes.DIM}>[Arrows] Edit</text>
      <text attributes={TextAttributes.DIM}>[Tab] Next</text>
      <text attributes={TextAttributes.DIM}>[Enter] Save</text>
    </>
  );
});

export const ConnectionsStatusBar = memo(function ConnectionsStatusBar() {
  return (
    <>
      <text attributes={TextAttributes.DIM}>[↑/↓] Select</text>
      <text attributes={TextAttributes.DIM}>[Enter] Reconfigure</text>
    </>
  );
});

export const TabSwitchHint = memo(function TabSwitchHint() {
  return <text attributes={TextAttributes.DIM}>[&lt;/&gt;] Switch tab</text>;
});

export const SavingIndicator = memo(function SavingIndicator() {
  return (
    <box justifyContent="center">
      <text attributes={TextAttributes.DIM}>Saving...</text>
    </box>
  );
});
