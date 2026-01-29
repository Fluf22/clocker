import { TextAttributes } from "@opentui/core";
import { memo } from "react";
import { MODAL_COLORS } from "../../constants/modalColors.ts";

export const ConnectionItem = memo(function ConnectionItem({ 
  label, 
  configured, 
  detail, 
  isSelected 
}: { 
  label: string; 
  configured: boolean; 
  detail?: string;
  isSelected: boolean;
}) {
  const statusIndicator = configured ? "✓" : "○";
  const statusText = configured ? "Connected" : "Not configured";

  return (
    <box flexDirection="row" gap={1} alignItems="center">
      <text attributes={isSelected ? TextAttributes.BOLD : TextAttributes.DIM}>
        {isSelected ? ">" : " "}
      </text>
      <box 
        flexDirection="column" 
        flexGrow={1}
        borderStyle={isSelected ? "single" : undefined}
        borderColor={MODAL_COLORS.active}
        paddingLeft={isSelected ? 1 : 0}
        paddingRight={isSelected ? 1 : 0}
      >
        <box flexDirection="row" justifyContent="space-between">
          <text attributes={isSelected ? TextAttributes.BOLD : 0}>{label}</text>
          <text attributes={configured ? TextAttributes.BOLD : TextAttributes.DIM}>
            {statusIndicator} {statusText}
          </text>
        </box>
        {detail && (
          <text attributes={TextAttributes.DIM}>{detail}</text>
        )}
      </box>
    </box>
  );
});
