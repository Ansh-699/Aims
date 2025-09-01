use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use chrono::Utc;
use tracing::{info, error};
use metrics::{counter, histogram, gauge};

use crate::models::RequestMetrics;

pub struct PerformanceMonitor {
    metrics: Arc<RwLock<HashMap<String, RequestMetrics>>>,
    request_counters: Arc<RwLock<HashMap<String, u64>>>,
    error_counters: Arc<RwLock<HashMap<String, u64>>>,
}

impl PerformanceMonitor {
    pub fn new() -> Self {
        Self {
            metrics: Arc::new(RwLock::new(HashMap::new())),
            request_counters: Arc::new(RwLock::new(HashMap::new())),
            error_counters: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn record_request(&self, route: &str, duration: u64, status: &str) {
        let metrics = RequestMetrics {
            duration,
            memory_usage: None, // Could be enhanced with actual memory tracking
            status: status.to_string(),
            timestamp: Utc::now(),
        };

        // Store in memory
        {
            let mut stored_metrics = self.metrics.write().await;
            stored_metrics.insert(format!("{}_{}", route, Utc::now().timestamp()), metrics);
        }

        // Update counters
        {
            let mut counters = self.request_counters.write().await;
            *counters.entry(route.to_string()).or_insert(0) += 1;
        }

        // Record metrics for monitoring
        counter!("requests_total", 1, "route" => route.to_string(), "status" => status.to_string());
        histogram!("request_duration_seconds", duration as f64 / 1000.0, "route" => route.to_string());
        gauge!("requests_in_flight", 1.0, "route" => route.to_string());

        info!("[Performance] {}: {}ms ({})", route, duration, status);
    }

    pub async fn record_error(&self, route: &str, error_type: &str) {
        // Update error counters
        {
            let mut error_counters = self.error_counters.write().await;
            *error_counters.entry(format!("{}_{}", route, error_type)).or_insert(0) += 1;
        }

        // Record metrics for monitoring
        counter!("errors_total", 1, "route" => route.to_string(), "error_type" => error_type.to_string());
        
        error!("[Performance] {} error: {}", route, error_type);
    }

    pub async fn get_metrics(&self) -> HashMap<String, serde_json::Value> {
        let mut result = HashMap::new();
        
        // Get request counters
        {
            let counters = self.request_counters.read().await;
            result.insert("request_counters".to_string(), serde_json::to_value(&*counters).unwrap_or_default());
        }

        // Get error counters
        {
            let error_counters = self.error_counters.read().await;
            result.insert("error_counters".to_string(), serde_json::to_value(&*error_counters).unwrap_or_default());
        }

        // Get recent metrics (last 100)
        {
            let metrics = self.metrics.read().await;
            let recent_metrics: Vec<_> = metrics.values().take(100).collect();
            result.insert("recent_metrics".to_string(), serde_json::to_value(recent_metrics).unwrap_or_default());
        }

        result
    }

    pub async fn clear_old_metrics(&self, max_age_hours: i64) {
        let cutoff = Utc::now() - chrono::Duration::hours(max_age_hours);
        
        {
            let mut metrics = self.metrics.write().await;
            metrics.retain(|_, metric| metric.timestamp > cutoff);
        }

        info!("[Performance] Cleared metrics older than {} hours", max_age_hours);
    }

    pub async fn get_route_stats(&self, route: &str) -> HashMap<String, serde_json::Value> {
        let mut stats = HashMap::new();
        
        // Get request count
        {
            let counters = self.request_counters.read().await;
            let count = counters.get(route).copied().unwrap_or(0);
            stats.insert("total_requests".to_string(), serde_json::Value::Number(count.into()));
        }

        // Get error count
        {
            let error_counters = self.error_counters.read().await;
            let error_count: u64 = error_counters
                .iter()
                .filter(|(key, _)| key.starts_with(route))
                .map(|(_, &count)| count)
                .sum();
            stats.insert("total_errors".to_string(), serde_json::Value::Number(error_count.into()));
        }

        // Get average response time
        {
            let metrics = self.metrics.read().await;
            let route_metrics: Vec<_> = metrics
                .values()
                .filter(|m| m.status == "success")
                .collect();
            
            if !route_metrics.is_empty() {
                let avg_duration: u64 = route_metrics.iter().map(|m| m.duration).sum::<u64>() / route_metrics.len() as u64;
                stats.insert("avg_response_time_ms".to_string(), serde_json::Value::Number(avg_duration.into()));
            }
        }

        stats
    }
}
