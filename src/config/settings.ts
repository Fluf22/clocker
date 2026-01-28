import { mkdir } from "node:fs/promises";
import { CONFIG_DIR } from "./credentials.ts";
import type { AppSettings, WorkSchedule } from "../types/index.ts";
import { join } from "node:path";

const SETTINGS_PATH = join(CONFIG_DIR, "settings.json");

export const DEFAULT_WORK_SCHEDULE: WorkSchedule = {
  morning: { start: "09:00", end: "12:00" },
  afternoon: { start: "14:00", end: "18:00" },
};

export const DEFAULT_SETTINGS: AppSettings = {
  workSchedule: DEFAULT_WORK_SCHEDULE,
};

export async function loadSettings(): Promise<AppSettings> {
  const file = Bun.file(SETTINGS_PATH);
  if (!(await file.exists())) {
    return DEFAULT_SETTINGS;
  }
  try {
    const saved = await file.json();
    return {
      ...DEFAULT_SETTINGS,
      ...saved,
      workSchedule: {
        ...DEFAULT_WORK_SCHEDULE,
        ...saved.workSchedule,
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true });
  await Bun.write(SETTINGS_PATH, JSON.stringify(settings, null, 2));
}
