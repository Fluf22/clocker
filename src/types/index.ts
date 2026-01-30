export interface BasicCredentials {
  type: "basic";
  companyDomain: string;
  apiKey: string;
}

export interface OAuthCredentials {
  type: "oauth";
  companyDomain: string;
  clientId: string;
  clientSecret: string;
  accessToken: string;
  refreshToken: string;
  expiresAtMs: number;
}

export type Credentials = BasicCredentials | OAuthCredentials;

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  preferredName?: string;
  jobTitle?: string;
  workEmail?: string;
  department?: string;
  division?: string;
  photoUrl?: string;
}

export interface BambooHRErrorResponse {
  error?: string;
  error_description?: string;
}

export interface TimesheetEntry {
  id: number;
  employeeId: number;
  type: "hour" | "clock";
  date: string;
  start?: string;
  end?: string;
  timezone?: string;
  hours?: number;
  note?: string;
  projectInfo?: {
    id: number;
    name: string;
  };
  approved: boolean;
}

export interface TimeOffRequest {
  id: number;
  employeeId: number;
  status: {
    status: string;
    lastChanged: string;
  };
  name: string;
  start: string;
  end: string;
  type: {
    id: number;
    name: string;
  };
  amount: {
    unit: string;
    amount: string;
  };
  dates: Record<string, number>;
}

export interface HourEntryRequest {
  date: string;
  hours: number;
  id?: number;
  projectId?: number;
  taskId?: number;
  note?: string;
}

export interface HourEntryResponse {
  id: number;
  employeeId: number;
  date: string;
  hours: number;
  note?: string;
}

export interface ClockEntryRequest {
  date: string;
  start: string;
  end: string;
  id?: number;
  projectId?: number;
  taskId?: number;
  note?: string;
}

export interface ClockEntryResponse {
  id: number;
  employeeId: number;
  date: string;
  start: string;
  end: string;
  note?: string;
}

export interface WhosOutEntry {
  type: "timeOff" | "holiday";
  employeeId?: number;
  name: string;
  start: string;
  end: string;
}

export interface Holiday {
  name: string;
  start: string;
  end: string;
}

export interface TimeRange {
  start: string;
  end: string;
}

export interface WorkSchedule {
  morning: TimeRange;
  afternoon: TimeRange;
}

export interface AppSettings {
  workSchedule: WorkSchedule;
}

export type ScheduleField = "morningStart" | "morningEnd" | "afternoonStart" | "afternoonEnd";
