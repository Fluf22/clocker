import * as nodemailer from "nodemailer";
import type { GmailConfig } from "../config/gmail.ts";
import { loadGmailConfig } from "../config/gmail.ts";

function createTransporter(config: GmailConfig) {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: config.email,
      pass: config.appPassword,
    },
  });
}

export async function verifyGmailCredentials(config: GmailConfig): Promise<void> {
  const transporter = createTransporter(config);
  await transporter.verify();
}

export async function sendEmail(
  subject: string,
  htmlBody: string,
  textBody: string
): Promise<void> {
  const config = await loadGmailConfig();
  if (!config) {
    throw new Error("Gmail not configured. Run setup first.");
  }

  const transporter = createTransporter(config);

  await transporter.sendMail({
    from: config.email,
    to: config.email,
    subject,
    text: textBody,
    html: htmlBody,
  });
}

export function formatReminderDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function createCalendarEvent(
  reminderDate: Date,
  lastWorkingDay: Date,
  monthName: string,
  email: string,
  submitCommand: string
): string {
  const eventStart = new Date(reminderDate);
  eventStart.setHours(9, 0, 0, 0);

  const eventEnd = new Date(reminderDate);
  eventEnd.setHours(9, 30, 0, 0);

  const now = new Date();
  const uid = `clocker-${reminderDate.toISOString().split("T")[0]}@clocker.local`;
  const summary = `Submit ${monthName} Timesheet (2 days left)`;
  const lastDayStr = formatReminderDate(lastWorkingDay);
  const description = [
    `Reminder: Last working day of ${monthName} is ${lastDayStr}.`,
    ``,
    `Run: ${submitCommand}`,
    ``,
    `Pro Tip: You can submit time ranges in advance and update them later if needed. Don't forget to review at end of month when you receive the BambooHR reminder.`,
  ].join("\\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Clocker//Timesheet Reminder//EN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatICSDate(now)}`,
    `DTSTART:${formatICSDate(eventStart)}`,
    `DTEND:${formatICSDate(eventEnd)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `ORGANIZER;CN=Clocker:mailto:${email}`,
    `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${email}`,
    "SEQUENCE:0",
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
}

export function createReminderEmail(
  monthName: string,
  reminderDate: Date,
  lastWorkingDay: Date,
  submitCommand: string
): { subject: string; html: string; text: string } {
  const reminderDateStr = formatReminderDate(reminderDate);
  const lastDayStr = formatReminderDate(lastWorkingDay);

  const subject = `Timesheet Reminder - ${monthName}`;

  const proTip = `Pro Tip: You can submit time ranges in advance and update them later if needed. Don't forget to review at end of month when you receive the BambooHR reminder.`;

  const text = `
Timesheet Reminder

Accept the calendar invite attached to this email to be reminded on ${reminderDateStr} (2 days before the last working day) to submit your ${monthName} timesheet.

Last working day: ${lastDayStr}

To submit your timesheet, run:

${submitCommand}

This command will open the bulk submission dialog and schedule the next reminder automatically.

💡 ${proTip}
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    h1 { color: #6366f1; }
    .calendar-notice { background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .calendar-notice strong { color: #166534; }
    .command { background: #1e1e2e; color: #a6e3a1; padding: 12px 16px; border-radius: 8px; font-family: 'SF Mono', Monaco, monospace; font-size: 14px; margin: 16px 0; }
    .copy-hint { color: #888; font-size: 12px; margin-top: 4px; }
    .pro-tip { background: #fef9c3; border: 1px solid #fde047; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .pro-tip-icon { font-size: 18px; margin-right: 8px; }
    .pro-tip strong { color: #a16207; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Timesheet Reminder</h1>
    <div class="calendar-notice">
      <strong>Accept the calendar invite</strong> attached to this email to be reminded on <strong>${reminderDateStr}</strong> (2 days before the last working day) to submit your <strong>${monthName}</strong> timesheet.
    </div>
    <p>Last working day: <strong>${lastDayStr}</strong></p>
    <p>To submit your timesheet, run:</p>
    <div class="command">${submitCommand}</div>
    <p class="copy-hint">Copy the command above and paste it in your terminal.</p>
    <p>This command will open the bulk submission dialog and schedule the next reminder automatically.</p>
    <div class="pro-tip">
      <span class="pro-tip-icon">💡</span><strong>Pro Tip:</strong> You can submit time ranges in advance and update them later if needed. Don't forget to review at end of month when you receive the BambooHR reminder.
    </div>
  </div>
</body>
</html>
`.trim();

  return { subject, html, text };
}

export async function scheduleReminderEmail(
  lastWorkingDay: Date,
  monthName: string,
  submitCommand: string
): Promise<void> {
  const config = await loadGmailConfig();
  if (!config) {
    throw new Error("Gmail not configured. Run setup first.");
  }

  const reminderDate = new Date(lastWorkingDay);
  reminderDate.setDate(reminderDate.getDate() - 2);

  const { subject, html, text } = createReminderEmail(monthName, reminderDate, lastWorkingDay, submitCommand);
  const icsContent = createCalendarEvent(reminderDate, lastWorkingDay, monthName, config.email, submitCommand);

  const transporter = createTransporter(config);

  await transporter.sendMail({
    from: config.email,
    to: config.email,
    subject,
    text,
    html,
    icalEvent: {
      filename: "timesheet-reminder.ics",
      method: "REQUEST",
      content: icsContent,
    },
  });
}
