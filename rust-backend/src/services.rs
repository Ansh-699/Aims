use tracing::{error, warn};
use crate::{
    error::AppError,
    models::*,
};

pub struct ExternalApiService {
    base_url: String,
    client: reqwest::Client,
}

impl ExternalApiService {
    pub fn new(base_url: &str) -> Self {
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(10))
            .build()
            .expect("Failed to create HTTP client");

        Self {
            base_url: base_url.to_string(),
            client,
        }
    }

    pub async fn get_attendance_records(&self, token: &str) -> Result<Vec<AttendanceRecord>, AppError> {
        let url = format!("{}/custom/getCFMappedWithStudentID?embed_attendance_summary=1", self.base_url);
        
        let response = self.client
            .get(&url)
            .header("Authorization", format!("Bearer {}", token))
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            error!("[ExternalAPI] Attendance fetch failed: {}", error_text);
            return Err(AppError::ExternalApiError(format!("External API error {}", status)));
        }

        let api_response: ExternalApiResponse<Vec<AttendanceRecord>> = response.json().await?;
        
        if let Some(response_data) = api_response.response {
            let records = response_data.data;
            if records.is_empty() {
                return Err(AppError::ExternalApiError("No attendance records returned".to_string()));
            }
            Ok(records)
        } else {
            Err(AppError::ExternalApiError("Invalid API response structure".to_string()))
        }
    }

    pub async fn get_subjects(&self, token: &str) -> Result<Vec<AttendanceRecord>, AppError> {
        let url = format!("{}/custom/getCFMappedWithStudentID", self.base_url);
        
        let response = self.client
            .get(&url)
            .header("Authorization", format!("Bearer {}", token))
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            error!("[ExternalAPI] Subjects fetch failed: {}", error_text);
            return Err(AppError::ExternalApiError("Failed to fetch subjects".to_string()));
        }

        let api_response: ExternalApiResponse<Vec<AttendanceRecord>> = response.json().await?;
        
        if let Some(response_data) = api_response.response {
            Ok(response_data.data)
        } else {
            Err(AppError::ExternalApiError("Invalid API response structure".to_string()))
        }
    }

    pub async fn fetch_subject_attendance(
        &self,
        token: &str,
        subject_name: &str,
        cf_id: &str,
        student_id: &str,
    ) -> Result<Vec<QuizRecord>, AppError> {
        let mut url = url::Url::parse(&format!("{}/cards", self.base_url)).map_err(|e| {
            AppError::InternalError(format!("Failed to parse URL: {}", e))
        })?;

        url.query_pairs_mut()
            .append_pair("type", "Attendance")
            .append_pair("sort_by", "-datetime1")
            .append_pair("report_title", subject_name)
            .append_pair("equalto___fk_student", student_id)
            .append_pair("equalto___cf_id", cf_id)
            .append_pair("token", token);

        let response = self.client
            .get(url.as_str())
            .send()
            .await?;

        if !response.status().is_success() {
            warn!("[ExternalAPI] Fetch cards failed for {}: HTTP {}", subject_name, response.status());
            return Err(AppError::ExternalApiError(format!("HTTP {}", response.status())));
        }

        let api_response: ExternalApiResponse<Vec<QuizRecord>> = response.json().await?;
        
        if let Some(response_data) = api_response.response {
            Ok(response_data.data)
        } else {
            Ok(Vec::new())
        }
    }

    pub async fn get_quiz_data(&self, token: &str) -> Result<serde_json::Value, AppError> {
        let url = format!("{}/custom/myEvaluatedQuizzes", self.base_url);
        
        let response = self.client
            .get(&url)
            .header("Authorization", format!("Bearer {}", token))
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let quiz_data: serde_json::Value = response.json().await.unwrap_or_default();
            let error_message = quiz_data["message"].as_str().unwrap_or("Unknown error");
            return Err(AppError::ExternalApiError(
                format!("API request failed with status {}: {}", status, error_message)
            ));
        }

        let quiz_data: serde_json::Value = response.json().await?;
        Ok(quiz_data)
    }

    // Helper method for retry logic
    pub async fn with_retry<F, T, E>(&self, mut f: F, max_retries: usize) -> Result<T, E>
    where
        F: FnMut() -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<T, E>> + Send>>,
        E: std::fmt::Debug,
    {
        let mut last_error = None;
        
        for attempt in 0..=max_retries {
            match f().await {
                Ok(result) => return Ok(result),
                Err(e) => {
                    last_error = Some(e);
                    if attempt < max_retries {
                        let delay = std::time::Duration::from_secs(2_u64.pow(attempt as u32));
                        tokio::time::sleep(delay).await;
                    }
                }
            }
        }
        
        Err(last_error.unwrap())
    }
}
