import type { Credentials, OAuthCredentials, Employee, TimesheetEntry, TimeOffRequest, HourEntryRequest, HourEntryResponse, Holiday } from "../types/index.ts";
import { saveCredentials, isTokenExpired } from "../config/credentials.ts";
import { refreshAccessToken } from "./auth.ts";

export class BambooHRClient {
  private credentials: Credentials;
  private employeeId: string | null = null;

  constructor(credentials: Credentials) {
    this.credentials = credentials;
  }

  getEmployeeId(): string | null {
    return this.employeeId;
  }

  private async ensureValidToken(): Promise<void> {
    if (this.credentials.type === "oauth" && isTokenExpired(this.credentials)) {
      this.credentials = await refreshAccessToken(this.credentials);
      await saveCredentials(this.credentials);
    }
  }

  private getAuthHeader(): string {
    if (this.credentials.type === "basic") {
      const encoded = btoa(`${this.credentials.apiKey}:x`);
      return `Basic ${encoded}`;
    }
    return `Bearer ${this.credentials.accessToken}`;
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    await this.ensureValidToken();

    const url = `https://${this.credentials.companyDomain}.bamboohr.com${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: this.getAuthHeader(),
        Accept: "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`BambooHR API error (${response.status}): ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  async getEmployee(
    id: string | number = 0,
    fields: string[] = ["id", "firstName", "lastName", "displayName", "jobTitle", "workEmail", "department"]
  ): Promise<Employee> {
    const fieldsParam = fields.join(",");
    const employee = await this.fetch<Employee>(`/api/v1/employees/${id}?fields=${fieldsParam}`);
    if (employee.id) {
      this.employeeId = employee.id;
    }
    return employee;
  }

  async getTimesheetEntries(start: string, end: string): Promise<TimesheetEntry[]> {
    if (!this.employeeId) {
      throw new Error("Employee ID not set. Call getEmployee() first.");
    }
    return this.fetch<TimesheetEntry[]>(
      `/api/v1/time_tracking/timesheet_entries?start=${start}&end=${end}&employeeIds=${this.employeeId}`
    );
  }

  async getTimeOffRequests(start: string, end: string): Promise<TimeOffRequest[]> {
    if (!this.employeeId) {
      throw new Error("Employee ID not set. Call getEmployee() first.");
    }
    const response = await this.fetch<Record<string, TimeOffRequest>>(
      `/api/v1/time_off/requests?start=${start}&end=${end}&employeeId=${this.employeeId}&status=approved`
    );
    return Object.values(response);
  }

  async storeHourEntry(entry: HourEntryRequest): Promise<HourEntryResponse> {
    if (!this.employeeId) {
      throw new Error("Employee ID not set. Call getEmployee() first.");
    }
    const response = await this.fetch<HourEntryResponse[]>(
      `/api/v1/time_tracking/hour_entries/store`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hours: [{
            ...entry,
            employeeId: Number(this.employeeId),
          }],
        }),
      }
    );
    const result = response[0];
    if (!result) {
      throw new Error("No response from API");
    }
    return result;
  }

  async storeHourEntries(entries: HourEntryRequest[]): Promise<HourEntryResponse[]> {
    return Promise.all(entries.map((entry) => this.storeHourEntry(entry)));
  }

  async getHolidays(start: string, end: string): Promise<Holiday[]> {
    interface WhosOutItem {
      type?: string;
      employeeId?: number;
      name?: string;
      start?: string;
      end?: string;
    }
    const response = await this.fetch<WhosOutItem[]>(
      `/api/v1/time_off/whos_out?start=${start}&end=${end}`
    );
    return response
      .filter((item) => item.type === "holiday")
      .map((item) => ({
        name: item.name ?? "Holiday",
        start: item.start ?? start,
        end: item.end ?? start,
      }));
  }
}

export async function createClient(credentials: Credentials): Promise<BambooHRClient> {
  return new BambooHRClient(credentials);
}
