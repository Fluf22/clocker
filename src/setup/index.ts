import { openBrowser, promptForInput } from "../utils/cli.ts";
import { saveCredentials } from "../config/credentials.ts";
import { saveGmailConfig } from "../config/gmail.ts";
import { verifyGmailCredentials } from "../email/sender.ts";
import type { BasicCredentials } from "../types/index.ts";

export async function setupCredentials(): Promise<BasicCredentials> {
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

export async function setupGmailAppPassword(employeeEmail: string): Promise<void> {
  console.log("\n=== Gmail App Password Setup ===\n");
  console.log("To receive email reminders, you need to create a Gmail App Password.");
  console.log("This requires 2-Step Verification to be enabled on your Google account.\n");

  console.log("Opening Google App Passwords page...");
  openBrowser("https://myaccount.google.com/apppasswords");

  console.log("\nSteps:");
  console.log("1. Sign in to your Google account if prompted");
  console.log("2. Select 'Mail' as the app");
  console.log("3. Select your device type");
  console.log("4. Click 'Generate'");
  console.log("5. Copy the 16-character password (spaces are optional)\n");

  const appPassword = await promptForInput("Paste your App Password: ");

  if (!appPassword) {
    console.error("App password is required for email reminders.");
    process.exit(1);
  }

  const cleanPassword = appPassword.replace(/\s/g, "");
  if (cleanPassword.length !== 16) {
    console.error("App password should be 16 characters. Got " + cleanPassword.length);
    process.exit(1);
  }

  const gmailConfig = { email: employeeEmail, appPassword: cleanPassword };

  console.log("\nVerifying credentials...");
  try {
    await verifyGmailCredentials(gmailConfig);
  } catch {
    console.error("Invalid credentials - could not connect to Gmail.");
    process.exit(1);
  }

  await saveGmailConfig(gmailConfig);
  console.log("Gmail configuration saved!\n");
}
