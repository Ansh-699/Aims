use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use std::sync::Arc;
use tracing::info;

mod cache;
mod config;
mod error;
mod handlers;
mod middleware;
mod models;
mod performance;
mod services;

use cache::Cache;
use config::Config;
use handlers::*;
use middleware::*;
use performance::PerformanceMonitor;

#[derive(Clone)]
pub struct AppState {
    cache: Arc<Cache>,
    config: Arc<Config>,
    performance_monitor: Arc<PerformanceMonitor>,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load environment variables
    dotenvy::dotenv().ok();

    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter("aims_backend=debug,tower_http=debug")
        .init();

    // Load configuration
    let config = Arc::new(Config::from_env()?);

    // Initialize cache
    let cache = Arc::new(Cache::new());

    // Initialize performance monitor
    let performance_monitor = Arc::new(PerformanceMonitor::new());

    // Create app state
    let state = AppState {
        cache: cache.clone(),
        config: config.clone(),
        performance_monitor: performance_monitor.clone(),
    };

    // Build router with middleware
    let app = Router::new()
        .route("/api/login", post(login_handler))
        .route("/api/attendance", post(attendance_handler))
        .route("/api/all-attendance", get(all_attendance_handler))
        .route("/api/quiz", get(quiz_handler))
        .route("/health", get(health_check))
        .route("/metrics", get(metrics_handler))
        .layer(cors_layer())
        .layer(rate_limit_layer())
        .with_state(state);

    // Start server
    let addr = format!("{}:{}", config.host, config.port);
    info!("Starting server on {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

pub async fn health_check() -> impl IntoResponse {
    Json(serde_json::json!({
        "status": "healthy",
        "timestamp": chrono::Utc::now().to_rfc3339()
    }))
}

pub async fn metrics_handler(State(state): State<AppState>) -> impl IntoResponse {
    let metrics = state.performance_monitor.get_metrics().await;
    Json(metrics)
}
