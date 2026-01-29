import { homedir } from "node:os";
import { join } from "node:path";
import { mkdir } from "node:fs/promises";

const CONFIG_DIR = join(homedir(), ".config", "clocker");
const GMAIL_CONFIG_PATH = join(CONFIG_DIR, "gmail.json");

export interface GmailConfig {
  email: string;
  appPassword: string;
}

export async function loadGmailConfig(): Promise<GmailConfig | null> {
  const file = Bun.file(GMAIL_CONFIG_PATH);
  if (!(await file.exists())) {
    return null;
  }
  try {
    return await file.json();
  } catch {
    return null;
  }
}

export async function saveGmailConfig(config: GmailConfig): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true });
  await Bun.write(GMAIL_CONFIG_PATH, JSON.stringify(config, null, 2));
}

export async function isGmailConfigured(): Promise<boolean> {
  const config = await loadGmailConfig();
  return config !== null;
}
