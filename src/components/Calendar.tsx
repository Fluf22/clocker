import { TextAttributes } from "@opentui/core";
import type { TimesheetEntry, TimeOffRequest, Holiday } from "../types/index.ts";

interface CalendarProps {
  year: number;
  month: number;
  entries: TimesheetEntry[];
  timeOff: TimeOffRequest[];
  holidays: Holiday[];
  selectedDay: number | null;
  loading?: boolean;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const COLORS = {
  selected: "#f0abfc",
  hasHours: "#86efac",
  timeOff: "#fcd34d",
  holiday: "#38bdf8",
  missing: "#f87171",
  weekend: "#64748b",
  border: "#334155",
};

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function getMonthName(month: number): string {
  return new Date(2000, month, 1).toLocaleString("en-US", { month: "long" });
}

function formatDate(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

type DayStatus = "weekend" | "timeOff" | "holiday" | "hasHours" | "missing" | "future";

interface DayCardProps {
  day: number | null;
  hours: number;
  isSelected: boolean;
  isToday: boolean;
  status: DayStatus;
  labelText?: string;
}

const DAY_CARD_CONTENT_WIDTH = 12;

function truncateLabel(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1) + "…";
}

function formatHoursAsDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h${m}m`;
}

function DayCard({ day, hours, isSelected, isToday, status, labelText }: DayCardProps) {
  if (day === null) {
    return (
      <box
        flexGrow={1}
        flexBasis={0}
        flexDirection="column"
        borderStyle="single"
        borderColor="transparent"
      >
        <box flexDirection="row" justifyContent="space-between" paddingLeft={1} paddingRight={1}>
          <text> </text>
        </box>
        <box flexGrow={1} alignItems="center" justifyContent="center">
          <text> </text>
        </box>
      </box>
    );
  }

  const dayStr = String(day);
  const timeStr = hours > 0 ? formatHoursAsDuration(hours) : "";
  const star = isToday ? "*" : "";

  let borderColor = COLORS.border;
  if (isSelected) {
    borderColor = COLORS.selected;
  } else if (status === "hasHours") {
    borderColor = COLORS.hasHours;
  } else if (status === "holiday") {
    borderColor = COLORS.holiday;
  } else if (status === "timeOff") {
    borderColor = COLORS.timeOff;
  } else if (status === "missing") {
    borderColor = COLORS.missing;
  }

  const isWeekend = status === "weekend";

  const dayAttr = isWeekend 
    ? TextAttributes.DIM 
    : isSelected 
      ? TextAttributes.BOLD 
      : 0;

  let contentText = "";
  let contentAttr = TextAttributes.DIM;
  let secondaryText = "";

  if (status === "hasHours") {
    contentText = timeStr;
    contentAttr = TextAttributes.BOLD;
  } else if (status === "holiday") {
    contentText = truncateLabel(labelText ?? "Hol", DAY_CARD_CONTENT_WIDTH);
    contentAttr = TextAttributes.BOLD;
    if (hours > 0) {
      secondaryText = timeStr;
    }
  } else if (status === "timeOff") {
    contentText = truncateLabel(labelText ?? "PTO", DAY_CARD_CONTENT_WIDTH);
    contentAttr = 0;
  } else if (status === "missing") {
    contentText = "!";
    contentAttr = TextAttributes.BOLD;
  } else if (status === "weekend") {
    contentText = "";
  } else {
    contentText = "-";
  }

  return (
    <box
      flexGrow={1}
      flexBasis={0}
      flexDirection="column"
      borderStyle={isSelected ? "double" : "single"}
      borderColor={borderColor}
    >
      <box flexDirection="row" justifyContent="space-between" paddingLeft={1} paddingRight={1}>
        <text attributes={dayAttr}>{dayStr}</text>
        <text attributes={TextAttributes.BOLD}>{star}</text>
      </box>
      <box flexGrow={1} flexDirection="column" alignItems="center" justifyContent="center">
        <text attributes={contentAttr}>{contentText}</text>
        {secondaryText && <text attributes={TextAttributes.DIM}>{secondaryText}</text>}
      </box>
    </box>
  );
}

export function Calendar({ year, month, entries, timeOff, holidays, selectedDay, loading }: CalendarProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthName = getMonthName(month);
  const today = new Date();

  const hoursByDate = new Map<string, number>();
  for (const entry of entries) {
    const existing = hoursByDate.get(entry.date) ?? 0;
    hoursByDate.set(entry.date, existing + (entry.hours ?? 0));
  }

  const timeOffByDate = new Map<string, string>();
  for (const request of timeOff) {
    if (request.dates) {
      for (const dateStr of Object.keys(request.dates)) {
        timeOffByDate.set(dateStr, request.type?.name ?? request.name ?? "PTO");
      }
    }
  }

  const holidayByDate = new Map<string, string[]>();
  for (const holiday of holidays) {
    const startDate = new Date(holiday.start);
    const endDate = new Date(holiday.end);
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0] ?? "";
      const existing = holidayByDate.get(dateStr) ?? [];
      existing.push(holiday.name);
      holidayByDate.set(dateStr, existing);
    }
  }

  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = [];

  for (let i = 0; i < firstDay; i++) {
    currentWeek.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  function getDayStatus(day: number, dayIndex: number): DayStatus {
    const isWeekend = dayIndex >= 5;
    if (isWeekend) return "weekend";

    const dateStr = formatDate(year, month, day);
    const date = new Date(year, month, day);
    
    if ((holidayByDate.get(dateStr)?.length ?? 0) > 0) return "holiday";
    if (timeOffByDate.has(dateStr)) return "timeOff";
    
    const hours = hoursByDate.get(dateStr) ?? 0;
    if (hours > 0) return "hasHours";
    
    if (date > today) return "future";
    
    return "missing";
  }

  function getHolidaysForDate(dateStr: string): string[] {
    return holidayByDate.get(dateStr) ?? [];
  }

  function getLabelForDate(dateStr: string): string | undefined {
    const holidays = getHolidaysForDate(dateStr);
    if (holidays.length > 1) {
      return `${holidays.length} holidays`;
    }
    if (holidays.length === 1) {
      return holidays[0];
    }
    return timeOffByDate.get(dateStr);
  }

  if (loading) {
    return (
      <box flexDirection="column" flexGrow={1}>
        <box justifyContent="center" marginBottom={1}>
          <text attributes={TextAttributes.BOLD}>{`< ${monthName} ${year} >`}</text>
        </box>
        <box flexGrow={1} alignItems="center" justifyContent="center">
          <text attributes={TextAttributes.DIM}>Loading...</text>
        </box>
      </box>
    );
  }

  return (
    <box flexDirection="column" flexGrow={1}>
      <box
        flexDirection="row"
        justifyContent="space-between" 
        alignItems="center" 
        marginBottom={1}
        borderStyle="rounded" 
        borderColor="#67e8f9" 
        paddingLeft={1} 
        paddingRight={1}
      >
        <text attributes={TextAttributes.DIM}>{"<"}</text>
        <text attributes={TextAttributes.BOLD}>{`${monthName} ${year}`}</text>
        <text attributes={TextAttributes.DIM}>{">"}</text>
      </box>

      <box flexDirection="row" height={1}>
        {DAY_NAMES.map((name, i) => (
          <box key={name} flexGrow={1} flexBasis={0} justifyContent="center">
            <text attributes={i >= 5 ? TextAttributes.DIM : 0}>{name}</text>
          </box>
        ))}
      </box>

      <box flexDirection="column" flexGrow={1}>
        {weeks.map((week, weekIndex) => (
          <box key={weekIndex} flexDirection="row" flexGrow={1} justifyContent="center">
            {week.map((day, dayIndex) => {
              const dateStr = day ? formatDate(year, month, day) : "";
              const hours = day ? (hoursByDate.get(dateStr) ?? 0) : 0;
              const isSelected = day === selectedDay;
              const isToday = day !== null && 
                year === today.getFullYear() && 
                month === today.getMonth() && 
                day === today.getDate();
              const status = day ? getDayStatus(day, dayIndex) : "weekend";
              const labelText = day ? getLabelForDate(dateStr) : undefined;

              return (
                <DayCard
                  key={dayIndex}
                  day={day}
                  hours={hours}
                  isSelected={isSelected}
                  isToday={isToday}
                  status={status}
                  labelText={labelText}
                />
              );
            })}
          </box>
        ))}
      </box>

      <box flexDirection="row" justifyContent="space-around" marginTop={1}>
        <box flexDirection="row" gap={1}>
          <text attributes={TextAttributes.BOLD}>*</text>
          <text attributes={TextAttributes.DIM}>Today</text>
        </box>
        <box flexDirection="row" gap={1}>
          <box backgroundColor={COLORS.missing} width={2}><text> </text></box>
          <text attributes={TextAttributes.DIM}>Missing</text>
        </box>
        <box flexDirection="row" gap={1}>
          <box backgroundColor={COLORS.hasHours} width={2}><text> </text></box>
          <text attributes={TextAttributes.DIM}>Logged</text>
        </box>
        <box flexDirection="row" gap={1}>
          <box backgroundColor={COLORS.timeOff} width={2}><text> </text></box>
          <text attributes={TextAttributes.DIM}>Time Off</text>
        </box>
        <box flexDirection="row" gap={1}>
          <box backgroundColor={COLORS.holiday} width={2}><text> </text></box>
          <text attributes={TextAttributes.DIM}>Holiday</text>
        </box>
      </box>
    </box>
  );
}
