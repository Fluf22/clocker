# Clocker TUI

Terminal User Interface for submitting monthly work timesheets to BambooHR.

## Installation

```bash
bun install
```

## Usage

```bash
bun dev
```

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `h/l` or `←/→` | Navigate days |
| `j/k` or `↓/↑` | Navigate weeks |
| `n/p` | Next/Previous month |
| `Enter` | View day details |
| `e` | Edit selected day |
| `s` | Bulk submit missing days |
| `c` | Configure work schedule |
| `q` | Quit |

## Email Reminders

Clocker can send you an email reminder on the last working day of each month.

### Setup

First time you run `--submit`, you'll be prompted to set up a Gmail App Password:

1. Enable 2-Step Verification on your Google account (if not already enabled)
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Select "Mail" as the app and generate a password
4. Paste the 16-character password when prompted

Your app password is stored locally in `~/.config/clocker/gmail.json`.

### Submit & Schedule Reminder

```bash
bun run src/index.tsx --submit
```

This command:
1. Submits clock entries for all missing workdays in the current month
2. Sends you an email reminder scheduled for next month's last working day
3. The email contains a copyable command to run for next month's submission

### How the Reminder Flow Works

1. Run `--submit` at the end of the month
2. Receive an email on the last working day of next month
3. Copy the command from the email and run it
4. Repeat each month

The last working day calculation accounts for weekends, holidays, and your time off.

## Configuration

- **BambooHR credentials**: `~/.config/clocker/credentials.json` (created on first run)
- **Gmail app password**: `~/.config/clocker/gmail.json` (created on first `--submit`)
- **Work schedule**: Configure in the app with `c` key, stored in `~/.config/clocker/settings.json`
