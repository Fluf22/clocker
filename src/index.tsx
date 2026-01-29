import { createCliRenderer, type CliRenderer, type InputRenderable } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { DialogProvider, useDialog, useDialogState } from "@opentui-ui/dialog/react";
import { useRef } from "react";
import { loadCredentials } from "./config/credentials.ts";
import { BambooHRClient } from "./api/client.ts";
import { Calendar } from "./components/Calendar.tsx";
import { Sidebar } from "./components/Sidebar.tsx";
import { StatusBar } from "./components/StatusBar.tsx";
import { type EditField } from "./components/EditModal.tsx";
import { type ConfigField, type ConfigTab, type ConnectionAction, type InputMode } from "./components/ConfigModal.tsx";
import { SettingsProvider, useSettings } from "./context/SettingsContext.tsx";
import { setupCredentials } from "./setup/index.ts";
import { handleSubmitFlag } from "./cli/submit.ts";
import { useTimesheetData } from "./hooks/useTimesheetData.ts";
import { useCalendarNavigation } from "./hooks/useCalendarNavigation.ts";
import { useDayInfo } from "./hooks/useDayInfo.ts";
import { useShowDayModal } from "./hooks/useShowDayModal.tsx";
import { useShowEditModal } from "./hooks/useShowEditModal.tsx";
import { useShowBulkModal } from "./hooks/useShowBulkModal.tsx";
import { useShowConfigModal } from "./hooks/useShowConfigModal.tsx";
import { useKeyboardNavigation } from "./hooks/useKeyboardNavigation.ts";
import type { WorkSchedule } from "./types/index.ts";

interface AppProps {
  client: BambooHRClient;
  renderer: CliRenderer;
}

function App({ client, renderer }: AppProps) {
  const dialog = useDialog();
  const isDialogOpen = useDialogState((s) => s.isOpen);
  const { settings, updateSettings } = useSettings();
  
  const { year, month, selectedDay, daysInMonth, navigateDay, navigateWeek, navigateMonth } = useCalendarNavigation();
  
  const { employee, entries, timeOff, holidays, loadingEntries, error, refreshEntries } = useTimesheetData(client, year, month);
  
  const { getMissingDays, getDayInfo } = useDayInfo(entries, timeOff, holidays, year, month, daysInMonth);
  
  const stateRef = useRef({
    saving: false,
    saveError: null as string | null,
    bulkProgress: 0,
    dialogOpen: false,
    configSchedule: null as WorkSchedule | null,
    configActiveField: "morningStart" as ConfigField,
    configCursorPosition: 0,
    configActiveTab: "schedule" as ConfigTab,
    configSelectedConnection: "bamboohr" as ConnectionAction,
    configConnections: {
      bamboohr: { configured: false, domain: undefined as string | undefined },
      gmail: { configured: false, email: undefined as string | undefined },
    },
    configInputMode: "none" as InputMode,
    configInputValue: "",
    configInputLabel: "",
    configInputPlaceholder: undefined as string | undefined,
    configInputData: { domain: "", apiKey: "" },
    configInputRef: null as InputRenderable | null,
    editSchedule: null as WorkSchedule | null,
    editActiveField: "morningStart" as EditField,
    editCursorPosition: 0,
  });

  const showEditModalRef = useRef<(() => void) | null>(null);

  const showDayModal = useShowDayModal({
    dialog,
    renderer,
    stateRef,
    year,
    month,
    selectedDay,
    entries,
    getDayInfo,
    onEditRequested: () => showEditModalRef.current?.(),
  });

  const showEditModal = useShowEditModal({
    dialog,
    renderer,
    client,
    stateRef,
    year,
    month,
    selectedDay,
    entries,
    workSchedule: settings.workSchedule,
    getDayInfo,
    refreshEntries,
    showDayModal,
  });
  
  showEditModalRef.current = showEditModal;

  const showBulkModal = useShowBulkModal({
    dialog,
    renderer,
    client,
    stateRef,
    year,
    month,
    workSchedule: settings.workSchedule,
    getMissingDays,
    refreshEntries,
  });

  const showConfigModal = useShowConfigModal({
    dialog,
    renderer,
    stateRef,
    settings,
    updateSettings,
    employee,
  });

  useKeyboardNavigation({
    renderer,
    isDialogOpen,
    navigateDay,
    navigateWeek,
    navigateMonth,
    showDayModal,
    showEditModal,
    showBulkModal,
    showConfigModal,
  });

  if (error) {
    return (
      <box alignItems="center" justifyContent="center" flexGrow={1}>
        <text>Error: {error}</text>
      </box>
    );
  }

  return (
    <box flexDirection="column" flexGrow={1} backgroundColor="#1f1f1f">
      <box flexDirection="row" flexGrow={1}>
        <Sidebar employee={employee} />

        <box flexDirection="column" flexGrow={1} padding={1} paddingTop={0}>
          <Calendar
            year={year}
            month={month}
            entries={entries}
            timeOff={timeOff}
            holidays={holidays}
            selectedDay={selectedDay}
            loading={loadingEntries}
          />
        </box>
      </box>

      <StatusBar />
    </box>
  );
}

function Root({ client, renderer }: AppProps) {
  return (
    <SettingsProvider>
      <DialogProvider 
        size="medium" 
        backdropOpacity={0.5}
        dialogOptions={{ 
          style: { backgroundColor: "#1e1e2e" }
        }}
      >
        <App client={client} renderer={renderer} />
      </DialogProvider>
    </SettingsProvider>
  );
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--submit")) {
    await handleSubmitFlag();
    return;
  }

  let credentials = await loadCredentials();

  if (!credentials) {
    credentials = await setupCredentials();
  }

  const client = new BambooHRClient(credentials);
  const renderer = await createCliRenderer();
  createRoot(renderer).render(<Root client={client} renderer={renderer} />);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
