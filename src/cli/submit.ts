import { loadCredentials } from "../config/credentials.ts";
import { loadGmailConfig } from "../config/gmail.ts";
import { loadSettings } from "../config/settings.ts";
import { wasReminderSent, markReminderSent } from "../config/reminders.ts";
import { BambooHRClient } from "../api/client.ts";
import { scheduleReminderEmail } from "../email/sender.ts";
import { getLastWorkingDay, getMonthName, getNextMonth } from "../utils/reminder.ts";
import { setupCredentials, setupGmailAppPassword } from "../setup/index.ts";
import { formatDate, isWeekendDate } from "../utils/date.ts";

export async function handleSubmitFlag(): Promise<void> {
  let credentials = await loadCredentials();
  if (!credentials) {
    credentials = await setupCredentials();
  }

  const client = new BambooHRClient(credentials);
  
  console.log("Fetching employee info...");
  const employee = await client.getEmployee(0, ["id", "firstName", "lastName", "workEmail"]);
  const employeeEmail = employee.workEmail;
  
  if (!employeeEmail) {
    console.error("Could not find employee work email in BambooHR.");
    process.exit(1);
  }

  let gmailConfig = await loadGmailConfig();
  if (!gmailConfig) {
    await setupGmailAppPassword(employeeEmail);
    gmailConfig = await loadGmailConfig();
  }

  if (!gmailConfig) {
    console.error("Gmail configuration failed.");
    process.exit(1);
  }

  const settings = await loadSettings();
  const schedule = settings.workSchedule;

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const startOfMonth = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endOfMonth = `${year}-${String(month + 1).padStart(2, "0")}-${lastDay}`;

  console.log("Fetching timesheet data...");
  const [entries, timeOff, holidays] = await Promise.all([
    client.getTimesheetEntries(startOfMonth, endOfMonth),
    client.getTimeOffRequests(startOfMonth, endOfMonth),
    client.getHolidays(startOfMonth, endOfMonth),
  ]);

  const isHoliday = (dateStr: string) => 
    holidays.some((h) => dateStr >= h.start && dateStr <= h.end);
  const isTimeOffDay = (dateStr: string) => 
    timeOff.some((t) => dateStr >= t.start && dateStr <= t.end);
  const hasEntry = (dateStr: string) => 
    entries.some((e) => e.date === dateStr);

  const missingDays: string[] = [];
  for (let day = 1; day <= today.getDate(); day++) {
    const date = new Date(year, month, day);
    const dateStr = formatDate(year, month, day);
    
    if (!isWeekendDate(date) && !isHoliday(dateStr) && !isTimeOffDay(dateStr) && !hasEntry(dateStr)) {
      missingDays.push(dateStr);
    }
  }

  if (missingDays.length === 0) {
    console.log("\nNo missing days to submit!");
  } else {
    console.log(`\nSubmitting ${missingDays.length} missing day(s)...`);
    
    for (const dateStr of missingDays) {
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
      console.log(`  Submitted: ${dateStr}`);
    }
    
    console.log("\nAll entries submitted!");
  }

  const nextMonth = getNextMonth(year, month);
  const nextMonthStart = `${nextMonth.year}-${String(nextMonth.month + 1).padStart(2, "0")}-01`;
  const nextMonthLastDay = new Date(nextMonth.year, nextMonth.month + 1, 0).getDate();
  const nextMonthEnd = `${nextMonth.year}-${String(nextMonth.month + 1).padStart(2, "0")}-${nextMonthLastDay}`;

  console.log("\nFetching next month's holidays and time off...");
  const [nextHolidays, nextTimeOff] = await Promise.all([
    client.getHolidays(nextMonthStart, nextMonthEnd),
    client.getTimeOffRequests(nextMonthStart, nextMonthEnd),
  ]);

  const nextLastWorkingDay = getLastWorkingDay(nextMonth.year, nextMonth.month, nextHolidays, nextTimeOff);
  const nextMonthName = getMonthName(nextMonth.month);

  const alreadySent = await wasReminderSent(nextMonth.year, nextMonth.month);
  if (alreadySent) {
    console.log(`\nReminder for ${nextMonthName} was already sent. Skipping.`);
    process.exit(0);
  }

  const submitCommand = "bun run src/index.tsx --submit";

  console.log(`\nScheduling reminder email for ${nextMonthName}...`);
  console.log(`Last working day: ${nextLastWorkingDay.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}`);

  await scheduleReminderEmail(nextLastWorkingDay, nextMonthName, submitCommand);
  await markReminderSent(nextMonth.year, nextMonth.month);
  console.log("Reminder email sent to " + gmailConfig.email);

  process.exit(0);
}
