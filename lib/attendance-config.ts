// Configuration for attendance system
// This file can be easily modified for different institutions or semesters

export interface PeriodConfig {
  id: number;
  time: string;
  start: string;
  end: string;
}

export interface AttendanceConfig {
  periods: PeriodConfig[];
  apiBaseUrl: string;
  endpoints: {
    authenticate: string;
    subjects: string;
    attendance: string;
    cards: string;
  };
}

// Default configuration - can be overridden for different institutions
export const defaultAttendanceConfig: AttendanceConfig = {
  periods: [
    { id: 1, time: "8:50 - 9:40", start: "08:50", end: "09:40" },
    { id: 2, time: "9:40 - 10:30", start: "09:40", end: "10:30" },
    { id: 3, time: "10:40 - 11:30", start: "10:40", end: "11:30" },
    { id: 4, time: "11:30 - 12:20", start: "11:30", end: "12:20" },
    { id: 5, time: "12:20 - 1:10", start: "12:20", end: "13:10" },
    { id: 6, time: "2:00 - 2:50", start: "14:00", end: "14:50" },
    { id: 7, time: "2:50 - 3:40", start: "14:50", end: "15:40" },
    { id: 8, time: "3:40 - 4:30", start: "15:40", end: "16:30" },
  ],
  apiBaseUrl: "https://abes.platform.simplifii.com/api/v1",
  endpoints: {
    authenticate: "/admin/authenticate",
    subjects: "/custom/getCFMappedWithStudentID",
    attendance: "/custom/getCFMappedWithStudentID?embed_attendance_summary=1",
    cards: "/cards"
  }
};

// Function to get current configuration
// In the future, this could load from environment variables or a database
export function getAttendanceConfig(): AttendanceConfig {
  return defaultAttendanceConfig;
}

// Helper function to build API URLs
export function buildApiUrl(endpoint: keyof AttendanceConfig['endpoints'], params?: Record<string, string>): string {
  const config = getAttendanceConfig();
  const url = new URL(config.apiBaseUrl + config.endpoints[endpoint]);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  
  return url.toString();
}