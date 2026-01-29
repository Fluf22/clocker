import { TextAttributes } from "@opentui/core";
import { memo } from "react";
import { MODAL_COLORS } from "../../constants/modalColors.ts";
import type { ConfigTab } from "../../types/config.ts";

export const TabBar = memo(function TabBar({ activeTab }: { activeTab: ConfigTab }) {
  return (
    <box flexDirection="row" justifyContent="center" gap={2} marginBottom={1}>
      <box 
        borderStyle={activeTab === "schedule" ? "single" : undefined}
        borderColor={MODAL_COLORS.active}
        paddingLeft={1}
        paddingRight={1}
      >
        <text attributes={activeTab === "schedule" ? TextAttributes.BOLD : TextAttributes.DIM}>
          Schedule
        </text>
      </box>
      <box 
        borderStyle={activeTab === "connections" ? "single" : undefined}
        borderColor={MODAL_COLORS.active}
        paddingLeft={1}
        paddingRight={1}
      >
        <text attributes={activeTab === "connections" ? TextAttributes.BOLD : TextAttributes.DIM}>
          Connections
        </text>
      </box>
    </box>
  );
});
