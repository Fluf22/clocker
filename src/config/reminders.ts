import { homedir } from "node:os";
import { join } from "node:path";
import { mkdir } from "node:fs/promises";

const CONFIG_DIR = join(homedir(), ".config", "clocker");
const REMINDERS_PATH = join(CONFIG_DIR, "reminders.json");

type YearMonth = `${number}-${string}`;

interface RemindersConfig {
  sentReminders: YearMonth[];
}

async function loadRemindersConfig(): Promise<RemindersConfig> {
  const file = Bun.file(REMINDERS_PATH);
  if (!(await file.exists())) {
    return { sentReminders: [] };
  }
  try {
    return await file.json();
  } catch {
    return { sentReminders: [] };
  }
}

async function saveRemindersConfig(config: RemindersConfig): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true });
  await Bun.write(REMINDERS_PATH, JSON.stringify(config, null, 2));
}

export function formatReminderKey(year: number, month: number): YearMonth {
  return `${year}-${String(month + 1).padStart(2, "0")}` as YearMonth;
}

export async function wasReminderSent(year: number, month: number): Promise<boolean> {
  const config = await loadRemindersConfig();
  const key = formatReminderKey(year, month);
  return config.sentReminders.includes(key);
}

export async function markReminderSent(year: number, month: number): Promise<void> {
  const config = await loadRemindersConfig();
  const key = formatReminderKey(year, month);
  if (!config.sentReminders.includes(key)) {
    config.sentReminders.push(key);
    await saveRemindersConfig(config);
  }
}
