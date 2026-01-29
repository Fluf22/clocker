import { TextAttributes } from "@opentui/core";
import { COLORS } from "../constants/colors.ts";

export function StatusBar() {
  return (
    <box borderStyle="rounded" borderColor={COLORS.statusBar} padding={1} flexDirection="row" justifyContent="center" gap={3}>
      <text attributes={TextAttributes.DIM}>[Arrows] Navigate</text>
      <text attributes={TextAttributes.DIM}>[Enter] View</text>
      <text attributes={TextAttributes.DIM}>[E] Edit</text>
      <text attributes={TextAttributes.DIM}>[S] Bulk Submit</text>
      <text attributes={TextAttributes.DIM}>[P/N] Prev/Next Month</text>
      <text attributes={TextAttributes.DIM}>[C] Config</text>
      <text attributes={TextAttributes.DIM}>[Q] Quit</text>
    </box>
  );
}
