import { homedir } from "node:os";
import { join } from "node:path";
import { mkdir } from "node:fs/promises";
import type { Credentials, BasicCredentials, OAuthCredentials } from "../types/index.ts";

const CONFIG_DIR = join(homedir(), ".config", "clocker");
const CREDENTIALS_PATH = join(CONFIG_DIR, "credentials.json");

export async function loadCredentialsFromEnv(): Promise<BasicCredentials | null> {
  const companyDomain = Bun.env.BAMBOOHR_COMPANY_DOMAIN;
  const apiKey = Bun.env.BAMBOOHR_API_KEY;

  if (companyDomain && apiKey) {
    return { type: "basic", companyDomain, apiKey };
  }
  return null;
}

export async function loadCredentials(): Promise<Credentials | null> {
  const envCredentials = await loadCredentialsFromEnv();
  if (envCredentials) {
    return envCredentials;
  }

  const file = Bun.file(CREDENTIALS_PATH);
  if (!(await file.exists())) {
    return null;
  }
  try {
    return await file.json();
  } catch {
    return null;
  }
}

export async function saveCredentials(credentials: Credentials): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true });
  await Bun.write(CREDENTIALS_PATH, JSON.stringify(credentials, null, 2));
}

export function isTokenExpired(credentials: OAuthCredentials): boolean {
  const bufferMs = 60_000;
  return Date.now() >= credentials.expiresAtMs - bufferMs;
}

export { CREDENTIALS_PATH, CONFIG_DIR };
