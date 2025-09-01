use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use chrono::{DateTime, Utc};

// Login models
#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub success: bool,
    pub token: Option<String>,
    pub message: Option<String>,
}

// Attendance models
#[derive(Debug, Deserialize)]
pub struct AttendanceRequest {
    pub token: String,
}

#[derive(Debug, Serialize)]
pub struct DailyAttendance {
    pub course: String,
    pub present: i32,
    pub total: i32,
    pub percent: f64,
}

#[derive(Debug, Serialize)]
pub struct AttendanceResponse {
    pub daily_attendance: Vec<DailyAttendance>,
    pub total_present: i32,
    pub total_classes: i32,
    pub overall_percentage: f64,
    pub batch: String,
    pub section: String,
    pub branch: String,
    pub student_id: String,
}

// All Attendance models
#[derive(Debug, Serialize)]
pub struct Subject {
    pub name: String,
    pub code: String,
    pub cf_id: String,
}

#[derive(Debug, Serialize)]
pub struct DailyAttendanceRecord {
    pub date: String,
    pub present: i32,
    pub absent: i32,
}

#[derive(Debug, Serialize)]
pub struct SubjectSummary {
    pub total_present: i32,
    pub total_absent: i32,
    pub daily: Vec<DailyAttendanceRecord>,
}

#[derive(Debug, Serialize)]
pub struct AllAttendanceResponse {
    pub student_id: String,
    pub total_present_all_subjects: i32,
    pub total_absent_all_subjects: i32,
    pub subjects: HashMap<String, SubjectSummary>,
    pub course_code_map: HashMap<String, String>,
    pub cached_at: DateTime<Utc>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub performance: Option<PerformanceMetrics>,
}

#[derive(Debug, Serialize)]
pub struct PerformanceMetrics {
    pub total_time: u64,
    pub avg_batch_time: u64,
    pub success_rate: f64,
    pub total_requests: usize,
    pub failed_requests: usize,
    pub batch_count: usize,
}

// Quiz models
#[derive(Debug, Serialize)]
pub struct QuizResponse {
    pub success: bool,
    pub data: Option<serde_json::Value>,
    pub message: Option<String>,
}

// External API models
#[derive(Debug, Deserialize)]
pub struct ExternalApiResponse<T> {
    pub response: Option<ApiResponseData<T>>,
    pub success: Option<bool>,
    pub message: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ApiResponseData<T> {
    pub data: T,
}

#[derive(Debug, Deserialize)]
pub struct CourseData {
    pub course_name: String,
    pub course_code: String,
}

#[derive(Debug, Deserialize)]
pub struct AttendanceSummary {
    pub Present: i32,
    pub Total: i32,
    pub Percent: f64,
}

#[derive(Debug, Deserialize)]
pub struct AttendanceRecord {
    pub cdata: CourseData,
    pub attendance_summary: AttendanceSummary,
    pub batch: String,
    pub section: String,
    pub dept: String,
    pub student_id: String,
    pub id: String,
}

#[derive(Debug, Deserialize)]
pub struct QuizRecord {
    pub state: String,
    pub start_time: Option<String>,
    pub date_formatted: Option<String>,
}

// Error models
#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
    pub message: Option<String>,
    pub timestamp: DateTime<Utc>,
}

// Cache models
#[derive(Debug, Clone)]
pub struct CacheEntry<T> {
    pub data: T,
    pub timestamp: DateTime<Utc>,
}

// Performance models
#[derive(Debug, Serialize)]
pub struct RequestMetrics {
    pub duration: u64,
    pub memory_usage: Option<u64>,
    pub status: String,
    pub timestamp: DateTime<Utc>,
}
