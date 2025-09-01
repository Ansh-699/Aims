use thiserror::Error;
use axum::response::IntoResponse;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("External API error: {0}")]
    ExternalApiError(String),
    
    #[error("Authentication failed: {0}")]
    AuthenticationError(String),
    
    #[error("Invalid request: {0}")]
    ValidationError(String),
    
    #[error("Cache error: {0}")]
    CacheError(String),
    
    #[error("Timeout error: {0}")]
    TimeoutError(String),
    
    #[error("Rate limit exceeded")]
    RateLimitError,
    
    #[error("Internal server error: {0}")]
    InternalError(String),
    
    #[error("Serialization error: {0}")]
    SerializationError(#[from] serde_json::Error),
    
    #[error("HTTP error: {0}")]
    HttpError(#[from] reqwest::Error),
}

impl AppError {
    pub fn status_code(&self) -> axum::http::StatusCode {
        match self {
            AppError::ExternalApiError(_) => axum::http::StatusCode::BAD_GATEWAY,
            AppError::AuthenticationError(_) => axum::http::StatusCode::UNAUTHORIZED,
            AppError::ValidationError(_) => axum::http::StatusCode::BAD_REQUEST,
            AppError::CacheError(_) => axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            AppError::TimeoutError(_) => axum::http::StatusCode::REQUEST_TIMEOUT,
            AppError::RateLimitError => axum::http::StatusCode::TOO_MANY_REQUESTS,
            AppError::InternalError(_) => axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            AppError::SerializationError(_) => axum::http::StatusCode::BAD_REQUEST,
            AppError::HttpError(_) => axum::http::StatusCode::BAD_GATEWAY,
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> axum::response::Response {
        let status = self.status_code();
        let error_response = crate::models::ErrorResponse {
            error: self.to_string(),
            message: None,
            timestamp: chrono::Utc::now(),
        };
        
        (status, axum::Json(error_response)).into_response()
    }
}
