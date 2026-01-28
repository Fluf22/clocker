import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { createCliRenderer, TextAttributes, type CliRenderer } from "@opentui/core";
import { createRoot, useRenderer } from "@opentui/react";
import { DialogProvider, useDialog, useDialogState } from "@opentui-ui/dialog/react";
import { useState, useEffect, useCallback, useRef } from "react";
import { loadCredentials, saveCredentials } from "./config/credentials.ts";
import { BambooHRClient } from "./api/client.ts";
import { Calendar } from "./components/Calendar.tsx";
import { DayModal } from "./components/DayModal.tsx";
import { EditModal, adjustTimeDigit, getScheduleHours, extractScheduleFromEntries, type EditField } from "./components/EditModal.tsx";
import { BulkSubmitModal } from "./components/BulkSubmitModal.tsx";
import { ConfigModal, type ConfigField } from "./components/ConfigModal.tsx";
import { SettingsProvider, useSettings } from "./context/SettingsContext.tsx";
import type { Employee, BasicCredentials, TimesheetEntry, TimeOffRequest, Holiday, WorkSchedule } from "./types/index.ts";

function openBrowser(url: string): void {
  const platform = process.platform;
  const cmd = platform === "darwin" ? "open" : platform === "win32" ? "start" : "xdg-open";
  Bun.spawn([cmd, url]);
}

async function promptForInput(question: string): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout });
  const answer = await rl.question(question);
  rl.close();
  return answer.trim();
}

async function setupCredentials(): Promise<BasicCredentials> {
  console.log("\n=== Clocker TUI Setup ===\n");

  const companyDomain = await promptForInput("Company domain (e.g., 'yourcompany' from yourcompany.bamboohr.com): ");

  if (!companyDomain) {
    console.error("Company domain is required.");
    process.exit(1);
  }

  const apiKeysUrl = `https://${companyDomain}.bamboohr.com/settings/permissions/api.php`;
  console.log(`\nOpening ${apiKeysUrl} to generate an API key...`);
  openBrowser(apiKeysUrl);

  console.log("\nOnce you've created an API key, paste it below.\n");
  const apiKey = await promptForInput("API Key: ");

  if (!apiKey) {
    console.error("API key is required.");
    process.exit(1);
  }

  const credentials: BasicCredentials = {
    type: "basic",
    companyDomain,
    apiKey,
  };

  await saveCredentials(credentials);
  console.log("\nCredentials saved!\n");

  return credentials;
}

const COLORS = {
  sidebar: "#a5b4fc",
  statusBar: "#6b7280",
  accent: "#c4b5fd",
};

function Sidebar({ employee }: { employee: Employee | null }) {
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

function StatusBar() {
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

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function formatDate(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function isWeekend(year: number, month: number, day: number): boolean {
  const dayOfWeek = new Date(year, month, day).getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
}

function findNextWeekday(year: number, month: number, day: number, delta: number, daysInMonth: number): number {
  let next = day + delta;
  while (next >= 1 && next <= daysInMonth && isWeekend(year, month, next)) {
    next += delta;
  }
  if (next < 1 || next > daysInMonth) return day;
  return next;
}

interface AppProps {
  client: BambooHRClient;
  renderer: CliRenderer;
}

function getInitialWeekday(year: number, month: number, day: number): number {
  const daysInMonth = getDaysInMonth(year, month);
  let d = day;
  while (d <= daysInMonth && isWeekend(year, month, d)) {
    d++;
  }
  if (d > daysInMonth) {
    d = day;
    while (d >= 1 && isWeekend(year, month, d)) {
      d--;
    }
  }
  return Math.max(1, d);
}

function App({ client, renderer }: AppProps) {
  const dialog = useDialog();
  const isDialogOpen = useDialogState((s) => s.isOpen);
  const { settings, updateSettings } = useSettings();
  
  const now = new Date();
  const initialYear = now.getFullYear();
  const initialMonth = now.getMonth();
  const initialDay = getInitialWeekday(initialYear, initialMonth, now.getDate());

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [timeOff, setTimeOff] = useState<TimeOffRequest[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loadingEmployee, setLoadingEmployee] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [selectedDay, setSelectedDay] = useState<number>(initialDay);

  const daysInMonth = getDaysInMonth(year, month);
  
  const stateRef = useRef({
    saving: false,
    saveError: null as string | null,
    bulkProgress: 0,
    dialogOpen: false,
    configSchedule: null as WorkSchedule | null,
    configActiveField: "morningStart" as ConfigField,
    configCursorPosition: 0,
    editSchedule: null as WorkSchedule | null,
    editActiveField: "morningStart" as EditField,
    editCursorPosition: 0,
  });
  
  const showEditModalRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setLoadingEmployee(true);
    client.getEmployee(0)
      .then(setEmployee)
      .catch((err) => setError(err instanceof Error ? err.message : "Unknown error"))
      .finally(() => setLoadingEmployee(false));
  }, [client]);

  useEffect(() => {
    if (!employee) return;

    const startDate = formatDate(year, month, 1);
    const endDate = formatDate(year, month, daysInMonth);

    setLoadingEntries(true);
    Promise.all([
      client.getTimesheetEntries(startDate, endDate),
      client.getTimeOffRequests(startDate, endDate),
      client.getHolidays(startDate, endDate),
    ])
      .then(([ent, off, hol]) => {
        setEntries(ent);
        setTimeOff(off);
        setHolidays(hol);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unknown error"))
      .finally(() => setLoadingEntries(false));
  }, [client, employee, year, month, daysInMonth]);

  const navigateDay = useCallback((delta: number) => {
    setSelectedDay((prev) => findNextWeekday(year, month, prev, delta, daysInMonth));
  }, [year, month, daysInMonth]);

  const navigateWeek = useCallback((delta: number) => {
    setSelectedDay((prev) => {
      let next = prev + delta * 7;
      if (next < 1) next = Math.max(1, next + daysInMonth);
      if (next > daysInMonth) next = Math.min(daysInMonth, next - daysInMonth);
      while (next >= 1 && next <= daysInMonth && isWeekend(year, month, next)) {
        next += delta > 0 ? 1 : -1;
      }
      if (next < 1 || next > daysInMonth) return prev;
      return next;
    });
  }, [year, month, daysInMonth]);

  const navigateMonth = useCallback((delta: number) => {
    let newYear = year;
    let newMonth = month + delta;
    if (newMonth < 0) {
      newYear -= 1;
      newMonth = 11;
    } else if (newMonth > 11) {
      newYear += 1;
      newMonth = 0;
    }
    
    if (newYear < 2026 || (newYear === 2026 && newMonth < 0)) {
      return;
    }
    
    const newDaysInMonth = getDaysInMonth(newYear, newMonth);
    let firstWeekday = 1;
    while (firstWeekday <= newDaysInMonth && isWeekend(newYear, newMonth, firstWeekday)) {
      firstWeekday++;
    }
    setYear(newYear);
    setMonth(newMonth);
    setSelectedDay(firstWeekday);
  }, [year, month]);

  const refreshEntries = useCallback(() => {
    if (!employee) return;
    const startDate = formatDate(year, month, 1);
    const endDate = formatDate(year, month, daysInMonth);
    setLoadingEntries(true);
    Promise.all([
      client.getTimesheetEntries(startDate, endDate),
      client.getTimeOffRequests(startDate, endDate),
      client.getHolidays(startDate, endDate),
    ])
      .then(([ent, off, hol]) => {
        setEntries(ent);
        setTimeOff(off);
        setHolidays(hol);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unknown error"))
      .finally(() => setLoadingEntries(false));
  }, [client, employee, year, month, daysInMonth]);

  const getMissingDays = useCallback((): string[] => {
    const today = new Date();
    const hoursByDate = new Map<string, number>();
    for (const entry of entries) {
      const existing = hoursByDate.get(entry.date) ?? 0;
      hoursByDate.set(entry.date, existing + (entry.hours ?? 0));
    }

    const timeOffDates = new Set<string>();
    for (const request of timeOff) {
      if (request.dates) {
        for (const dateStr of Object.keys(request.dates)) {
          timeOffDates.add(dateStr);
        }
      }
    }

    const holidayDates = new Set<string>();
    for (const holiday of holidays) {
      const startDate = new Date(holiday.start);
      const endDate = new Date(holiday.end);
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0] ?? "";
        holidayDates.add(dateStr);
      }
    }

    const missing: string[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      if (isWeekend(year, month, day)) continue;
      
      const dateStr = formatDate(year, month, day);
      const date = new Date(year, month, day);
      
      if (date > today) continue;
      if (holidayDates.has(dateStr)) continue;
      if (timeOffDates.has(dateStr)) continue;
      if ((hoursByDate.get(dateStr) ?? 0) > 0) continue;
      
      missing.push(dateStr);
    }
    return missing;
  }, [entries, timeOff, holidays, year, month, daysInMonth]);

  const getDayInfo = useCallback((dateStr: string): { type: "normal" | "timeOff" | "holiday"; label?: string; holidayNames?: string[] } => {
    const holidayNames: string[] = [];
    for (const holiday of holidays) {
      const startDate = new Date(holiday.start);
      const endDate = new Date(holiday.end);
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        if (d.toISOString().split("T")[0] === dateStr) {
          holidayNames.push(holiday.name);
        }
      }
    }
    
    if (holidayNames.length > 0) {
      return { type: "holiday", holidayNames };
    }
    
    for (const request of timeOff) {
      if (request.dates && dateStr in request.dates) {
        return { type: "timeOff", label: request.type?.name ?? request.name ?? "Time Off" };
      }
    }
    
    return { type: "normal" };
  }, [holidays, timeOff]);

  const showDayModal = useCallback(() => {
    if (stateRef.current.dialogOpen) return;
    stateRef.current.dialogOpen = true;
    
    const dateStr = formatDate(year, month, selectedDay);
    const dayEntries = entries.filter((e) => e.date === dateStr);
    const dayInfo = getDayInfo(dateStr);
    
    let dayModalHandlerRef: ((event: { name: string }) => void) | null = null;
    let openEditAfterClose = false;
    
    const cleanup = () => {
      if (dayModalHandlerRef) {
        renderer.keyInput.off("keypress", dayModalHandlerRef);
        dayModalHandlerRef = null;
      }
      stateRef.current.dialogOpen = false;
      
      if (openEditAfterClose && dayInfo.type !== "timeOff") {
        setTimeout(() => showEditModalRef.current?.(), 0);
      }
    };
    
    const dayModalHandler = (event: { name: string }) => {
      if (event.name === "return") {
        dialog.close();
      } else if (event.name === "e" && dayInfo.type !== "timeOff") {
        openEditAfterClose = true;
        dialog.close();
      }
    };
    
    dayModalHandlerRef = dayModalHandler;
    renderer.keyInput.on("keypress", dayModalHandler);
    
    dialog.show({
      content: () => (
        <DayModal
          date={dateStr}
          entries={dayEntries}
          dayType={dayInfo.type}
          dayLabel={dayInfo.label}
          holidayNames={dayInfo.holidayNames}
          onClose={() => dialog.close()}
        />
      ),
      closeOnEscape: true,
      backdropOpacity: 0.6,
      id: "day-modal",
      onClose: cleanup,
    });
  }, [dialog, renderer, year, month, selectedDay, entries, getDayInfo]);

  const showEditModal = useCallback(() => {
    if (stateRef.current.dialogOpen) return;
    stateRef.current.dialogOpen = true;
    
    const dateStr = formatDate(year, month, selectedDay);
    const dayInfo = getDayInfo(dateStr);
    if (dayInfo.type === "timeOff") {
      stateRef.current.dialogOpen = false;
      return;
    }
    
    const dayEntries = entries.filter((e) => e.date === dateStr);
    stateRef.current.editSchedule = extractScheduleFromEntries(dayEntries, settings.workSchedule);
    stateRef.current.editActiveField = "morningStart";
    stateRef.current.editCursorPosition = 0;
    stateRef.current.saveError = null;
    stateRef.current.saving = false;
    
    let editHandlerRef: ((event: { name: string; shift?: boolean }) => void) | null = null;
    
    const cleanup = () => {
      if (editHandlerRef) {
        renderer.keyInput.off("keypress", editHandlerRef);
        editHandlerRef = null;
      }
      stateRef.current.dialogOpen = false;
      stateRef.current.saving = false;
    };
    
    const updateDialog = () => {
      if (!stateRef.current.editSchedule) return;
      dialog.show({
        content: () => (
          <EditModal
            date={dateStr}
            schedule={stateRef.current.editSchedule!}
            activeField={stateRef.current.editActiveField}
            cursorPosition={stateRef.current.editCursorPosition}
            saving={stateRef.current.saving}
            error={stateRef.current.saveError}
          />
        ),
        closeOnEscape: !stateRef.current.saving,
        backdropOpacity: 0.6,
        id: "edit-modal",
        onClose: cleanup,
      });
    };

    const fields: EditField[] = ["morningStart", "morningEnd", "afternoonStart", "afternoonEnd"];
    
    const getFieldValue = (field: EditField): string => {
      if (!stateRef.current.editSchedule) return "00:00";
      switch (field) {
        case "morningStart": return stateRef.current.editSchedule.morning.start;
        case "morningEnd": return stateRef.current.editSchedule.morning.end;
        case "afternoonStart": return stateRef.current.editSchedule.afternoon.start;
        case "afternoonEnd": return stateRef.current.editSchedule.afternoon.end;
      }
    };
    
    const setFieldValue = (field: EditField, value: string) => {
      if (!stateRef.current.editSchedule) return;
      switch (field) {
        case "morningStart":
          stateRef.current.editSchedule.morning.start = value;
          break;
        case "morningEnd":
          stateRef.current.editSchedule.morning.end = value;
          break;
        case "afternoonStart":
          stateRef.current.editSchedule.afternoon.start = value;
          break;
        case "afternoonEnd":
          stateRef.current.editSchedule.afternoon.end = value;
          break;
      }
    };

    const saveClockEntries = async () => {
      if (!stateRef.current.editSchedule) return;
      
      const schedule = stateRef.current.editSchedule;
      const hours = getScheduleHours(schedule);
      if (hours < 0 || hours > 24) {
        stateRef.current.saveError = "Invalid hours (0-24)";
        updateDialog();
        return;
      }
      
      stateRef.current.saving = true;
      stateRef.current.saveError = null;
      updateDialog();
      
      try {
        await client.storeClockEntry({
          date: dateStr,
          start: schedule.morning.start,
          end: schedule.morning.end,
        });
        await client.storeClockEntry({
          date: dateStr,
          start: schedule.afternoon.start,
          end: schedule.afternoon.end,
        });
        
        refreshEntries();
        dialog.close();
      } catch (err) {
        stateRef.current.saveError = err instanceof Error ? err.message : "Save failed";
        stateRef.current.saving = false;
        updateDialog();
      }
    };

    const editHandler = (event: { name: string; shift?: boolean }) => {
      if (stateRef.current.saving) return;
      
      if (event.name === "return") {
        saveClockEntries();
        return;
      }
      
      if (event.name === "tab") {
        const currentIndex = fields.indexOf(stateRef.current.editActiveField);
        const nextIndex = event.shift 
          ? (currentIndex - 1 + fields.length) % fields.length
          : (currentIndex + 1) % fields.length;
        stateRef.current.editActiveField = fields[nextIndex] ?? "morningStart";
        stateRef.current.editCursorPosition = 0;
        updateDialog();
        return;
      }
      
      if (event.name === "left") {
        stateRef.current.editCursorPosition = Math.max(0, stateRef.current.editCursorPosition - 1);
        updateDialog();
        return;
      }
      
      if (event.name === "right") {
        stateRef.current.editCursorPosition = Math.min(3, stateRef.current.editCursorPosition + 1);
        updateDialog();
        return;
      }
      
      if (event.name === "up") {
        const currentValue = getFieldValue(stateRef.current.editActiveField);
        const newValue = adjustTimeDigit(currentValue, stateRef.current.editCursorPosition, 1);
        setFieldValue(stateRef.current.editActiveField, newValue);
        updateDialog();
        return;
      }
      
      if (event.name === "down") {
        const currentValue = getFieldValue(stateRef.current.editActiveField);
        const newValue = adjustTimeDigit(currentValue, stateRef.current.editCursorPosition, -1);
        setFieldValue(stateRef.current.editActiveField, newValue);
        updateDialog();
        return;
      }
    };
    
    editHandlerRef = editHandler;
    renderer.keyInput.on("keypress", editHandler);
    updateDialog();
    
  }, [dialog, renderer, client, year, month, selectedDay, settings, refreshEntries, getDayInfo]);

  showEditModalRef.current = showEditModal;

  const showBulkModal = useCallback(() => {
    if (stateRef.current.dialogOpen) return;
    stateRef.current.dialogOpen = true;
    
    const missingDays = getMissingDays();
    if (missingDays.length === 0) {
      stateRef.current.dialogOpen = false;
      return;
    }
    
    const hoursPerDay = getScheduleHours(settings.workSchedule);
    
    stateRef.current.bulkProgress = 0;
    stateRef.current.saveError = null;
    stateRef.current.saving = false;
    
    let bulkHandlerRef: ((event: { name: string }) => void) | null = null;
    
    const cleanup = () => {
      if (bulkHandlerRef) {
        renderer.keyInput.off("keypress", bulkHandlerRef);
        bulkHandlerRef = null;
      }
      stateRef.current.dialogOpen = false;
      stateRef.current.saving = false;
    };
    
    const updateDialog = () => {
      dialog.show({
        content: () => (
          <BulkSubmitModal
            missingDays={missingDays}
            hours={hoursPerDay}
            saving={stateRef.current.saving}
            progress={stateRef.current.bulkProgress}
            error={stateRef.current.saveError}
          />
        ),
        closeOnEscape: !stateRef.current.saving,
        backdropOpacity: 0.6,
        id: "bulk-modal",
        onClose: cleanup,
      });
    };

    const bulkSubmit = async () => {
      stateRef.current.saving = true;
      stateRef.current.saveError = null;
      stateRef.current.bulkProgress = 0;
      updateDialog();

      const schedule = settings.workSchedule;
      
      try {
        for (let i = 0; i < missingDays.length; i++) {
          const dateStr = missingDays[i];
          if (!dateStr) continue;
          
          await client.storeClockEntry({
            date: dateStr,
            start: schedule.morning.start,
            end: schedule.morning.end,
          });
          await client.storeClockEntry({
            date: dateStr,
            start: schedule.afternoon.start,
            end: schedule.afternoon.end,
          });
          
          stateRef.current.bulkProgress = i + 1;
          updateDialog();
        }
        refreshEntries();
        dialog.close();
      } catch (err) {
        stateRef.current.saveError = err instanceof Error ? err.message : "Bulk save failed";
        stateRef.current.saving = false;
        updateDialog();
      }
    };

    const bulkHandler = (event: { name: string }) => {
      if (event.name === "return" && !stateRef.current.saving) {
        bulkSubmit();
      }
    };
    
    bulkHandlerRef = bulkHandler;
    renderer.keyInput.on("keypress", bulkHandler);
    updateDialog();
  }, [dialog, renderer, client, settings, getMissingDays, refreshEntries]);

  const showConfigModal = useCallback(() => {
    if (stateRef.current.dialogOpen) return;
    stateRef.current.dialogOpen = true;
    
    stateRef.current.configSchedule = {
      morning: { ...settings.workSchedule.morning },
      afternoon: { ...settings.workSchedule.afternoon },
    };
    stateRef.current.configActiveField = "morningStart";
    stateRef.current.configCursorPosition = 0;
    stateRef.current.saveError = null;
    stateRef.current.saving = false;
    
    let configHandlerRef: ((event: { name: string; shift?: boolean }) => void) | null = null;
    
    const cleanup = () => {
      if (configHandlerRef) {
        renderer.keyInput.off("keypress", configHandlerRef);
        configHandlerRef = null;
      }
      stateRef.current.dialogOpen = false;
      stateRef.current.saving = false;
    };
    
    const updateDialog = () => {
      if (!stateRef.current.configSchedule) return;
      dialog.show({
        content: () => (
          <ConfigModal
            schedule={stateRef.current.configSchedule!}
            activeField={stateRef.current.configActiveField}
            cursorPosition={stateRef.current.configCursorPosition}
            saving={stateRef.current.saving}
            error={stateRef.current.saveError}
          />
        ),
        closeOnEscape: !stateRef.current.saving,
        backdropOpacity: 0.6,
        id: "config-modal",
        onClose: cleanup,
      });
    };

    const fields: ConfigField[] = ["morningStart", "morningEnd", "afternoonStart", "afternoonEnd"];
    
    const getFieldValue = (field: ConfigField): string => {
      if (!stateRef.current.configSchedule) return "00:00";
      switch (field) {
        case "morningStart": return stateRef.current.configSchedule.morning.start;
        case "morningEnd": return stateRef.current.configSchedule.morning.end;
        case "afternoonStart": return stateRef.current.configSchedule.afternoon.start;
        case "afternoonEnd": return stateRef.current.configSchedule.afternoon.end;
      }
    };
    
    const setFieldValue = (field: ConfigField, value: string) => {
      if (!stateRef.current.configSchedule) return;
      switch (field) {
        case "morningStart":
          stateRef.current.configSchedule.morning.start = value;
          break;
        case "morningEnd":
          stateRef.current.configSchedule.morning.end = value;
          break;
        case "afternoonStart":
          stateRef.current.configSchedule.afternoon.start = value;
          break;
        case "afternoonEnd":
          stateRef.current.configSchedule.afternoon.end = value;
          break;
      }
    };

    const saveConfig = async () => {
      if (!stateRef.current.configSchedule) return;
      
      stateRef.current.saving = true;
      stateRef.current.saveError = null;
      updateDialog();
      
      try {
        await updateSettings({
          ...settings,
          workSchedule: stateRef.current.configSchedule,
        });
        dialog.close();
      } catch (err) {
        stateRef.current.saveError = err instanceof Error ? err.message : "Save failed";
        stateRef.current.saving = false;
        updateDialog();
      }
    };

    const configHandler = (event: { name: string; shift?: boolean }) => {
      if (stateRef.current.saving) return;
      
      if (event.name === "return") {
        saveConfig();
        return;
      }
      
      if (event.name === "tab") {
        const currentIndex = fields.indexOf(stateRef.current.configActiveField);
        const nextIndex = event.shift 
          ? (currentIndex - 1 + fields.length) % fields.length
          : (currentIndex + 1) % fields.length;
        stateRef.current.configActiveField = fields[nextIndex] ?? "morningStart";
        stateRef.current.configCursorPosition = 0;
        updateDialog();
        return;
      }
      
      if (event.name === "left") {
        stateRef.current.configCursorPosition = Math.max(0, stateRef.current.configCursorPosition - 1);
        updateDialog();
        return;
      }
      
      if (event.name === "right") {
        stateRef.current.configCursorPosition = Math.min(3, stateRef.current.configCursorPosition + 1);
        updateDialog();
        return;
      }
      
      if (event.name === "up") {
        const currentValue = getFieldValue(stateRef.current.configActiveField);
        const newValue = adjustTimeDigit(currentValue, stateRef.current.configCursorPosition, 1);
        setFieldValue(stateRef.current.configActiveField, newValue);
        updateDialog();
        return;
      }
      
      if (event.name === "down") {
        const currentValue = getFieldValue(stateRef.current.configActiveField);
        const newValue = adjustTimeDigit(currentValue, stateRef.current.configCursorPosition, -1);
        setFieldValue(stateRef.current.configActiveField, newValue);
        updateDialog();
        return;
      }
    };
    
    configHandlerRef = configHandler;
    renderer.keyInput.on("keypress", configHandler);
    updateDialog();
  }, [dialog, renderer, settings, updateSettings]);

  useEffect(() => {
    const handler = (event: { name: string; ctrl: boolean; shift: boolean }) => {
      if (isDialogOpen) {
        if (event.name === "q") {
          renderer.destroy();
          process.exit(0);
        }
        return;
      }
      
      switch (event.name) {
        case "left":
          navigateDay(-1);
          break;
        case "right":
          navigateDay(1);
          break;
        case "up":
          navigateWeek(-1);
          break;
        case "down":
          navigateWeek(1);
          break;
        case "p":
        case "[":
          navigateMonth(-1);
          break;
        case "n":
        case "]":
          navigateMonth(1);
          break;
        case "return":
          showDayModal();
          break;
        case "e":
          showEditModal();
          break;
        case "s":
          showBulkModal();
          break;
        case "c":
          showConfigModal();
          break;
        case "q":
          renderer.destroy();
          process.exit(0);
          break;
      }
    };

    renderer.keyInput.on("keypress", handler);
    return () => {
      renderer.keyInput.off("keypress", handler);
    };
  }, [renderer, isDialogOpen, navigateDay, navigateWeek, navigateMonth, showDayModal, showEditModal, showBulkModal, showConfigModal]);

  if (error) {
    return (
      <box alignItems="center" justifyContent="center" flexGrow={1}>
        <text attributes={TextAttributes.BOLD}>Error: {error}</text>
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
