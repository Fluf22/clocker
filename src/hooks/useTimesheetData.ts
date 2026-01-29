import { useState, useEffect, useCallback } from "react";
import { BambooHRClient } from "../api/client.ts";
import { formatDate, getDaysInMonth } from "../utils/date.ts";
import type { Employee, TimesheetEntry, TimeOffRequest, Holiday } from "../types/index.ts";

interface UseTimesheetDataResult {
  employee: Employee | null;
  entries: TimesheetEntry[];
  timeOff: TimeOffRequest[];
  holidays: Holiday[];
  loadingEmployee: boolean;
  loadingEntries: boolean;
  error: string | null;
  refreshEntries: () => void;
}

export function useTimesheetData(
  client: BambooHRClient,
  year: number,
  month: number
): UseTimesheetDataResult {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [timeOff, setTimeOff] = useState<TimeOffRequest[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loadingEmployee, setLoadingEmployee] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const daysInMonth = getDaysInMonth(year, month);

  useEffect(() => {
    setLoadingEmployee(true);
    client.getEmployee(0)
      .then(setEmployee)
      .catch((err) => setError(err instanceof Error ? err.message : "Unknown error"))
      .finally(() => setLoadingEmployee(false));
  }, [client]);

  const fetchEntries = useCallback(() => {
    if (!employee) return;
    
    const startDate = formatDate(year, month, 1);
    const endDate = formatDate(year, month, daysInMonth);

    setLoadingEntries(true);
    Promise.all([
      client.getTimesheetEntries(startDate, endDate),
      client.getTimeOffRequests(startDate, endDate),
      client.getHolidays(startDate, endDate),
    ])
      .then(([ent, off, hol]) => {
        setEntries(ent);
        setTimeOff(off);
        setHolidays(hol);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unknown error"))
      .finally(() => setLoadingEntries(false));
  }, [client, employee, year, month, daysInMonth]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return {
    employee,
    entries,
    timeOff,
    holidays,
    loadingEmployee,
    loadingEntries,
    error,
    refreshEntries: fetchEntries,
  };
}
