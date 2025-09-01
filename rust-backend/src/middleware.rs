use axum::{
    extract::State,
    http::{Request, HeaderName, Method},
    middleware::Next,
    response::Response,
};
use std::time::Instant;
use tower_http::cors::{Any, CorsLayer};
use tracing::info;

use crate::{AppState, error::AppError};

pub fn cors_layer() -> CorsLayer {
    CorsLayer::new()
        .allow_origin("http://localhost:3000".parse::<axum::http::HeaderValue>().unwrap())
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers([HeaderName::from_static("authorization"), HeaderName::from_static("content-type")])
        .allow_credentials(true)
}

pub fn rate_limit_layer() -> tower::ServiceBuilder<tower::layer::util::Identity> {
    tower::ServiceBuilder::new()
}

// trace_layer removed to avoid complex generic signature issues with tower-http TraceLayer.
// If needed, a simple TraceLayer can be added later with explicit generic parameters.
pub async fn performance_middleware<B>(
    State(state): State<AppState>,
    request: Request<axum::body::Body>,
    next: Next,
) -> Result<Response, AppError> {
    let start_time = Instant::now();
    let path = request.uri().path().to_string();
    
    let response = next.run(request).await;
    let duration = start_time.elapsed().as_millis() as u64;
    
    let status = if response.status().is_success() { "success" } else { "error" };
    state.performance_monitor.record_request(&path, duration, status).await;
    
    Ok(response)
}

pub async fn error_handling_middleware<B>(
    request: Request<axum::body::Body>,
    next: Next,
) -> Result<Response, AppError> {
    match next.run(request).await {
        response if response.status().is_success() => Ok(response),
        response => {
            let status = response.status();
            let error = match status.as_u16() {
                400 => AppError::ValidationError("Bad request".to_string()),
                401 => AppError::AuthenticationError("Unauthorized".to_string()),
                403 => AppError::AuthenticationError("Forbidden".to_string()),
                404 => AppError::ValidationError("Not found".to_string()),
                429 => AppError::RateLimitError,
                500 => AppError::InternalError("Internal server error".to_string()),
                _ => AppError::InternalError(format!("HTTP error: {}", status)),
            };
            Err(error)
        }
    }
}

pub async fn logging_middleware<B>(
    request: Request<axum::body::Body>,
    next: Next,
) -> Result<Response, AppError> {
    let method = request.method().clone();
    let uri = request.uri().clone();
    let start_time = Instant::now();
    
    info!("Request started: {} {}", method, uri);
    
    let response = next.run(request).await;
    let duration = start_time.elapsed();
    
    info!(
        "Request completed: {} {} - {} - {}ms",
        method,
        uri,
        response.status(),
        duration.as_millis()
    );
    
    Ok(response)
}
