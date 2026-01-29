import { TextAttributes } from "@opentui/core";
import { COLORS } from "../constants/colors.ts";
import type { Employee } from "../types/index.ts";

interface SidebarProps {
  employee: Employee | null;
}

export function Sidebar({ employee }: SidebarProps) {
  if (!employee) {
    return (
      <box width={26} flexDirection="column" borderStyle="rounded" borderColor={COLORS.sidebar} padding={1}>
        <text attributes={TextAttributes.DIM}>Loading...</text>
      </box>
    );
  }

  const displayName = employee.displayName ?? `${employee.firstName} ${employee.lastName}`;

  return (
    <box width={26} flexDirection="column" borderStyle="rounded" borderColor={COLORS.sidebar} padding={1}>
      <box marginBottom={1}>
        <text attributes={TextAttributes.BOLD}>User</text>
      </box>
      
      <box flexDirection="column" gap={1}>
        <box flexDirection="column">
          <text attributes={TextAttributes.DIM}>Name</text>
          <text attributes={TextAttributes.BOLD}>{displayName}</text>
        </box>
        
        {employee.jobTitle && (
          <box flexDirection="column">
            <text attributes={TextAttributes.DIM}>Role</text>
            <text>{employee.jobTitle}</text>
          </box>
        )}
        
        {employee.department && (
          <box flexDirection="column">
            <text attributes={TextAttributes.DIM}>Team</text>
            <text>{employee.department}</text>
          </box>
        )}
      </box>
    </box>
  );
}
