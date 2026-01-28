# AGENTS.md - Clocker TUI

> Guidelines for AI agents working in this codebase.

## Project Overview

**clocker-tui** is a Terminal User Interface for submitting monthly work timesheets to BambooHR.

### Purpose
- User-friendly terminal interface for timesheet management
- Single-click button submission for monthly timesheets
- View, edit, and submit time entries without leaving the terminal

### Tech Stack
- **Runtime**: [Bun](https://bun.sh/)
- **UI Framework**: [OpenTUI](https://opentui.dev/) with React 19
- **Language**: TypeScript (strict mode)
- **Backend**: BambooHR API

---

## Quick Reference

| Task | Command |
|------|---------|
| Install dependencies | `bun install` |
| Run (with hot reload) | `bun dev` |
| Build executable | `bun run build` |
| Type check | `bun tsc --noEmit` |
| Run single file | `bun run <file.ts>` |

### Testing (when configured)
- Use Bun's built-in test runner: `bun test`
- Test files: `*.test.ts` or `*.test.tsx`
- Run single test: `bun test <file.test.ts>`

---

## BambooHR API Integration

### Key Endpoints

| Operation | Endpoint | Method |
|-----------|----------|--------|
| Get timesheet entries | `/api/v1/time_tracking/timesheet_entries` | GET |
| Add/edit hour entries | `/api/v1/time_tracking/hour_entries/store` | POST |
| Add/edit clock entries | `/api/v1/time_tracking/clock_entries/store` | POST |
| Delete hour entries | `/api/v1/time_tracking/hour_entries/delete` | POST |
| Delete clock entries | `/api/v1/time_tracking/clock_entries/delete` | POST |

### Authentication
- **Basic Auth**: API key as username, "x" as password
- **OAuth**: Scopes `time_tracking` (read), `time_tracking.write` (write)
- **Base URL**: `https://{companyDomain}.bamboohr.com`

### Data Formats
- Dates: `YYYY-MM-DD`
- Times: `HH:mm` (24-hour format)
- **Employee ID `0`**: Special value meaning "the employee who owns this API key" - use this to get/update the current user's data without knowing their actual employee ID

### Timesheet Entry Structure
```typescript
interface TimesheetEntry {
  id: number;
  employeeId: number;
  type: string;           // "clock" or "hour"
  date: string;           // YYYY-MM-DD
  start?: string;         // ISO datetime (clock entries)
  end?: string;           // ISO datetime (clock entries)
  hours?: number;         // Hours worked (hour entries)
  note?: string;
  projectInfo?: { id: number; name: string };
  approved: boolean;
}
```

### Hour Entry Request
```typescript
interface HourEntryRequest {
  date: string;           // YYYY-MM-DD
  hours: number;
  id?: number;            // For editing existing entry
  projectId?: number;
  taskId?: number;
  note?: string;
}
```

---

## TypeScript Configuration

### Strict Mode Rules
```json
{
  "strict": true,
  "noFallthroughCasesInSwitch": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitOverride": true,
  "verbatimModuleSyntax": true
}
```

### Critical Rules
1. **Never suppress types**: No `as any`, `@ts-ignore`, `@ts-expect-error`
2. **Handle undefined**: `arr[0]` returns `T | undefined`
3. **Explicit type imports**:
   ```typescript
   import type { TimesheetEntry } from "./types";
   import { fetchEntries } from "./api";
   ```

---

## Code Style

### File Structure
```
src/
  index.tsx              # Entry point
  api/                   # BambooHR API client
    client.ts            # HTTP client setup
    timesheet.ts         # Timesheet endpoints
  components/            # React components
    TimesheetView.tsx
    EntryRow.tsx
    SubmitButton.tsx
  hooks/                 # Custom hooks
    useTimesheet.ts
  utils/                 # Utilities
    date.ts
    format.ts
  types/                 # Type definitions
    bamboohr.ts
```

### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `TimesheetView` |
| Functions | camelCase | `submitTimesheet` |
| Constants | SCREAMING_SNAKE | `API_BASE_URL` |
| Types | PascalCase | `TimesheetEntry` |

### Imports Order
1. External packages (`react`, `@opentui/*`)
2. Internal modules (`./api`, `./hooks`)
3. Relative imports (`./utils`)

### OpenTUI Components
- `<box>` - Flexbox container
- `<text>` - Text content
- `<ascii-font>` - ASCII art text
- `TextAttributes.BOLD`, `TextAttributes.DIM` - Styling

---

## Environment Configuration

Store sensitive config in `.env` (gitignored):
```env
BAMBOOHR_COMPANY_DOMAIN=yourcompany
BAMBOOHR_API_KEY=your-api-key
```

Access via `Bun.env.BAMBOOHR_API_KEY`.

---

## Error Handling

```typescript
// API errors - handle explicitly
try {
  const entries = await fetchTimesheetEntries(start, end);
} catch (error) {
  if (error instanceof BambooHRError) {
    // Handle API-specific errors (401, 403, etc.)
  }
  throw error;
}

// Never use empty catch blocks
```

---

## What NOT To Do

1. **Don't suppress TypeScript errors** - fix them properly
2. **Don't hardcode credentials** - use environment variables
3. **Don't commit `.env` files** - they contain secrets
4. **Don't use CommonJS** - ESM only
5. **Don't create class components** - use function components
6. **Don't leave console.log** - use proper logging

---

## Common Patterns

### API Client
```typescript
async function bamboohrFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(
    `https://${Bun.env.BAMBOOHR_COMPANY_DOMAIN}.bamboohr.com${endpoint}`,
    {
      ...options,
      headers: {
        Authorization: `Basic ${btoa(Bun.env.BAMBOOHR_API_KEY + ":x")}`,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    }
  );
  if (!response.ok) throw new BambooHRError(response);
  return response.json();
}
```

### React State
```typescript
function TimesheetView() {
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimesheetEntries(startDate, endDate)
      .then(setEntries)
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  return loading ? <text>Loading...</text> : <EntryList entries={entries} />;
}
```
