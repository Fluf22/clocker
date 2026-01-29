import { memo } from "react";
import type { ConnectionStatus, ConnectionAction } from "../../types/config.ts";
import { ConnectionItem } from "./ConnectionItem.tsx";

export const ConnectionsTab = memo(function ConnectionsTab({ 
  connections, 
  selectedConnection 
}: { 
  connections: ConnectionStatus; 
  selectedConnection: ConnectionAction;
}) {
  return (
    <box flexDirection="column" gap={2} marginBottom={1}>
      <ConnectionItem
        label="BambooHR"
        configured={connections.bamboohr.configured}
        detail={connections.bamboohr.domain ? `Domain: ${connections.bamboohr.domain}` : undefined}
        isSelected={selectedConnection === "bamboohr"}
      />
      <ConnectionItem
        label="Gmail Reminders"
        configured={connections.gmail.configured}
        detail={connections.gmail.email ? `Email: ${connections.gmail.email}` : undefined}
        isSelected={selectedConnection === "gmail"}
      />
    </box>
  );
});
