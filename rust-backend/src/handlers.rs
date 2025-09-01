use axum::{
    extract::State,
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    Json,
};
use std::time::Instant;
use tracing::{error, info, warn};
use rayon::prelude::*;
use std::collections::HashMap;

use crate::{
    error::AppError,
    models::*,
    services::ExternalApiService,
    AppState,
};

pub async fn login_handler(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<impl IntoResponse, AppError> {
    let start_time = Instant::now();
    
    info!("[login] start");
    
    let result = async {
        let form_data = format!("username={}&password={}", 
            urlencoding::encode(&payload.username), 
            urlencoding::encode(&payload.password)
        );

        let client = reqwest::Client::new();
        let response = client
            .post("https://abes.platform.simplifii.com/api/v1/admin/authenticate")
            .header("Content-Type", "application/x-www-form-urlencoded")
            .header("Origin", "https://abes.web.simplifii.com")
            .header("Referer", "https://abes.web.simplifii.com/")
            .body(form_data)
            .timeout(std::time::Duration::from_secs(state.config.request_timeout_seconds))
            .send()
            .await?;

        let status = response.status();
        let data: serde_json::Value = response.json().await?;

        Ok::<_, AppError>((status, data))
    }.await;

    match result {
        Ok((status, data)) => {
            let duration = start_time.elapsed().as_millis() as u64;
            state.performance_monitor.record_request("login", duration, "success").await;
            
            info!("[login] completed in {}ms", duration);
            
            Ok((StatusCode::from_u16(status.as_u16()).unwrap_or(StatusCode::OK), Json(data)))
        }
        Err(e) => {
            let duration = start_time.elapsed().as_millis() as u64;
            state.performance_monitor.record_error("login", &e.to_string()).await;
            
            error!("[login] error: {}", e);
            Err(e)
        }
    }
}

pub async fn attendance_handler(
    State(state): State<AppState>,
    Json(payload): Json<AttendanceRequest>,
) -> Result<impl IntoResponse, AppError> {
    let start_time = Instant::now();
    
    info!("[attendance] start");

    if payload.token.is_empty() {
        warn!("[attendance] missing token");
        return Err(AppError::ValidationError("Missing token in request body".to_string()));
    }

    info!("[attendance] token: {}...", &payload.token[..std::cmp::min(10, payload.token.len())]);

    // Check cache first
    let cache_key = format!("attendance_{}", &payload.token[..std::cmp::min(10, payload.token.len())]);
    if let Some(cached_data) = state.cache.get_attendance(&cache_key).await {
        let duration = start_time.elapsed().as_millis() as u64;
        state.performance_monitor.record_request("attendance", duration, "cache_hit").await;
        
        info!("[attendance] serving from cache");
        
        return Ok((
            StatusCode::OK,
            [("Cache-Control", "max-age=300, stale-while-revalidate=1800"), ("X-Cache", "HIT")],
            Json(cached_data)
        ));
    }

        let result = async {
            let api_service = ExternalApiService::new(&state.config.external_api_base);
            let records = api_service.get_attendance_records(&payload.token).await?;

            if records.is_empty() {
                return Err(AppError::ExternalApiError("No attendance records returned".to_string()));
            }

            let total_summary = &records[records.len() - 1];
            let daily_records = &records[..records.len() - 1];

            let daily_attendance: Vec<DailyAttendance> = daily_records
                .par_iter()
                .map(|r| DailyAttendance {
                    course: r.cdata.course_name.trim().to_string(),
                    present: r.attendance_summary.Present,
                    total: r.attendance_summary.Total,
                    percent: r.attendance_summary.Percent,
                })
                .collect();

            let response_data = AttendanceResponse {
                daily_attendance,
                total_present: total_summary.attendance_summary.Present,
                total_classes: total_summary.attendance_summary.Total,
                overall_percentage: total_summary.attendance_summary.Percent,
                batch: daily_records[0].batch.clone(),
                section: daily_records[0].section.clone(),
                branch: daily_records[0].dept.clone(),
                student_id: daily_records[0].student_id.clone(),
            };

            // Store in cache
            let response_value = serde_json::to_value(&response_data).map_err(|e| AppError::InternalError(format!("Serialization error: {}", e)))?;
            state.cache.set_attendance(cache_key, response_value.clone()).await;

            Ok::<_, AppError>(response_value)
        }.await;

    match result {
        Ok(response_data) => {
            let duration = start_time.elapsed().as_millis() as u64;
            state.performance_monitor.record_request("attendance", duration, "success").await;
            
            info!("[attendance] processed, sending response");
            
            Ok((
                StatusCode::OK,
                [("Cache-Control", "max-age=300, stale-while-revalidate=1800"), ("X-Cache", "MISS")],
                Json(response_data)
            ))
        }
        Err(e) => {
            let duration = start_time.elapsed().as_millis() as u64;
            state.performance_monitor.record_error("attendance", &e.to_string()).await;
            
            error!("[attendance] error: {}", e);
            Err(e)
        }
    }
}

pub async fn all_attendance_handler(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<impl IntoResponse, AppError> {
    let start_time = Instant::now();
    
    info!("[all-attendance] start (GET)");

    // Extract authorization
    let auth_header = headers
        .get("authorization")
        .and_then(|h| h.to_str().ok())
        .unwrap_or("");
    
    let token = auth_header.trim_start_matches("Bearer ").trim();
    if token.is_empty() {
        return Err(AppError::ValidationError("Missing Authorization header with Bearer token".to_string()));
    }

    // Check cache
    let cache_key = format!("attendance_{}", &token[..std::cmp::min(10, token.len())]);
    if let Some(cached_data) = state.cache.get_all_attendance(&cache_key).await {
        let duration = start_time.elapsed().as_millis() as u64;
        state.performance_monitor.record_request("all-attendance", duration, "cache_hit").await;
        
        info!("[all-attendance] serving from cache");
        
        return Ok((
            StatusCode::OK,
            [("Cache-Control", "max-age=300, stale-while-revalidate=1800"), ("X-Cache", "HIT")],
            Json(cached_data)
        ));
    }

    let result = async {
        let api_service = ExternalApiService::new(&state.config.external_api_base);
        
        // Get student ID from attendance API
        let attendance_records = api_service.get_attendance_records(token).await?;
        let student_id = attendance_records[0].student_id.clone();
        
        info!("[all-attendance] studentId: {}", student_id);

        // Get subjects list
        let subjects_data = api_service.get_subjects(token).await?;
        let subjects: Vec<Subject> = subjects_data
            .par_iter()
            .map(|entry| Subject {
                name: entry.cdata.course_name.trim().to_string(),
                code: entry.cdata.course_code.clone(),
                cf_id: entry.id.clone(),
            })
            .collect();

        if subjects.is_empty() {
            return Err(AppError::ExternalApiError("No subjects found".to_string()));
        }

        // Create course code mapping
        let course_code_map: HashMap<String, String> = subjects_data
            .par_iter()
            .map(|entry| (
                entry.cdata.course_code.clone(),
                entry.cdata.course_name.trim().to_string()
            ))
            .collect();

        // Parallel fetching for all subjects with enhanced timeout and retry logic
        let fetch_results: Vec<_> = subjects
            .par_iter()
            .map(|subject| {
                let base_url = state.config.external_api_base.clone();
                let subject_name = subject.name.clone();
                let subject_cf_id = subject.cf_id.clone();
                let student_id = student_id.clone();
                let token = token.to_string();
                
                async move {
                    let api_service = ExternalApiService::new(&base_url);
                    api_service.fetch_subject_attendance(&token, &subject_name, &subject_cf_id, &student_id).await
                }
            })
            .collect();

        let mut grand_present = 0;
        let mut grand_absent = 0;
        let mut subjects_summary: HashMap<String, SubjectSummary> = HashMap::new();

        for (subject, result) in subjects.iter().zip(fetch_results) {
            match result.await {
                Ok(data) => {
                    let present_count = data.iter().filter(|d| d.state == "Present").count() as i32;
                    let absent_count = data.iter().filter(|d| d.state == "Absent").count() as i32;
                    grand_present += present_count;
                    grand_absent += absent_count;

                    // Process daily attendance
                    let mut by_date: HashMap<String, (i32, i32)> = HashMap::new();
                    for record in &data {
                        let date_key = if let Some(start_time) = &record.start_time {
                            if let Ok(dt) = chrono::DateTime::parse_from_rfc3339(start_time) {
                                dt.format("%Y-%m-%d").to_string()
                            } else {
                                chrono::Utc::now().format("%Y-%m-%d").to_string()
                            }
                        } else if let Some(date_formatted) = &record.date_formatted {
                            if let Some(date_part) = date_formatted.split_whitespace().last() {
                                date_part.to_string()
                            } else {
                                chrono::Utc::now().format("%Y-%m-%d").to_string()
                            }
                        } else {
                            chrono::Utc::now().format("%Y-%m-%d").to_string()
                        };

                        let entry = by_date.entry(date_key).or_insert((0, 0));
                        if record.state == "Present" {
                            entry.0 += 1;
                        } else {
                            entry.1 += 1;
                        }
                    }

                    let daily: Vec<DailyAttendanceRecord> = by_date
                        .into_iter()
                        .map(|(date, (present, absent))| DailyAttendanceRecord {
                            date,
                            present,
                            absent,
                        })
                        .collect();

                    subjects_summary.insert(subject.name.clone(), SubjectSummary {
                        total_present: present_count,
                        total_absent: absent_count,
                        daily,
                    });
                }
                Err(e) => {
                    warn!("[all-attendance] Failed to fetch data for {}: {}", subject.name, e);
                }
            }
        }

        let response_data = AllAttendanceResponse {
            student_id,
            total_present_all_subjects: grand_present,
            total_absent_all_subjects: grand_absent,
            subjects: subjects_summary,
            course_code_map,
            cached_at: chrono::Utc::now(),
            performance: None, // Could be enhanced with actual performance metrics
        };

        // Store in cache
        let response_value = serde_json::to_value(&response_data).map_err(|e| AppError::InternalError(format!("Serialization error: {}", e)))?;
        state.cache.set_all_attendance(cache_key, response_value.clone()).await;

        Ok::<_, AppError>(response_value)
    }.await;

    match result {
        Ok(response_data) => {
            let duration = start_time.elapsed().as_millis() as u64;
            state.performance_monitor.record_request("all-attendance", duration, "success").await;
            
            info!("[all-attendance] completed in {}ms", duration);
            
            Ok((
                StatusCode::OK,
                [("Cache-Control", "max-age=300, stale-while-revalidate=1800"), ("X-Cache", "MISS")],
                Json(response_data)
            ))
        }
        Err(e) => {
            let duration = start_time.elapsed().as_millis() as u64;
            state.performance_monitor.record_error("all-attendance", &e.to_string()).await;
            
            error!("[all-attendance] error: {}", e);
            Err(e)
        }
    }
}

pub async fn quiz_handler(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<impl IntoResponse, AppError> {
    let start_time = Instant::now();
    
    let auth_header = headers
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .unwrap_or("");

    if !auth_header.starts_with("Bearer ") {
        return Err(AppError::AuthenticationError("Token required in Authorization header".to_string()));
    }

    let token = auth_header.trim_start_matches("Bearer ").trim();
    let cache_key = format!("quiz_{}", &token[..std::cmp::min(10, token.len())]);

    // Check cache first
    if let Some(cached_data) = state.cache.get_quiz(&cache_key).await {
        let duration = start_time.elapsed().as_millis() as u64;
        state.performance_monitor.record_request("quiz", duration, "cache_hit").await;
        
        info!("[quiz] serving from cache");
        
        return Ok((
            StatusCode::OK,
            [("Cache-Control", "max-age=300, stale-while-revalidate=1800"), ("X-Cache", "HIT")],
            Json(cached_data)
        ));
    }

    // Check for pending request
    match state.cache.get_or_create_pending_request(cache_key.clone()).await {
        Ok(data) => {
            let duration = start_time.elapsed().as_millis() as u64;
            state.performance_monitor.record_request("quiz", duration, "pending_hit").await;
            
            info!("[quiz] waiting for pending request");
            
            return Ok((
                StatusCode::OK,
                [("Cache-Control", "max-age=300, stale-while-revalidate=1800"), ("X-Cache", "PENDING")],
                Json(data)
            ));
        }
        Err(_) => {
            // Continue to make new request
        }
    }

    let result = async {
        let api_service = ExternalApiService::new(&state.config.external_api_base);
        let quiz_data = api_service.get_quiz_data(token).await?;
        
        // Store in cache
        state.cache.set_quiz(cache_key.clone(), serde_json::to_value(&quiz_data)?).await;
        
        Ok::<_, AppError>(quiz_data)
    }.await;

    match result {
        Ok(quiz_data) => {
            // Complete pending request
            state.cache.complete_pending_request(&cache_key, Ok(serde_json::to_value(&quiz_data)?)).await;
            
            let duration = start_time.elapsed().as_millis() as u64;
            state.performance_monitor.record_request("quiz", duration, "success").await;
            
            Ok((
                StatusCode::OK,
                [("Cache-Control", "max-age=300, stale-while-revalidate=1800"), ("X-Cache", "MISS")],
                Json(quiz_data)
            ))
        }
        Err(e) => {
            // Complete pending request with error
            state.cache.complete_pending_request(&cache_key, Err(e.to_string())).await;
            
            let duration = start_time.elapsed().as_millis() as u64;
            state.performance_monitor.record_error("quiz", &e.to_string()).await;
            
            error!("[quiz] API error: {}", e);
            Err(e)
        }
    }
}
