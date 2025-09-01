use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use chrono::Utc;
use moka::future::Cache as MokaCache;
use tracing::{info, warn};
use std::time::Duration as StdDuration;

use crate::models::CacheEntry;

pub struct Cache {
    attendance_cache: MokaCache<String, CacheEntry<serde_json::Value>>,
    quiz_cache: MokaCache<String, CacheEntry<serde_json::Value>>,
    all_attendance_cache: MokaCache<String, CacheEntry<serde_json::Value>>,
    pending_requests: Arc<RwLock<HashMap<String, tokio::sync::oneshot::Sender<Result<serde_json::Value, String>>>>>,
}

impl Cache {
    pub fn new() -> Self {
        // Configure cache with TTL and max capacity
        let attendance_cache = MokaCache::builder()
            .time_to_live(StdDuration::from_secs(5 * 60))
            .max_capacity(1000)
            .build();

        let quiz_cache = MokaCache::builder()
            .time_to_live(StdDuration::from_secs(5 * 60))
            .max_capacity(1000)
            .build();

        let all_attendance_cache = MokaCache::builder()
            .time_to_live(StdDuration::from_secs(5 * 60))
            .max_capacity(1000)
            .build();

        Self {
            attendance_cache,
            quiz_cache,
            all_attendance_cache,
            pending_requests: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn get_attendance(&self, key: &str) -> Option<serde_json::Value> {
        if let Some(entry) = self.attendance_cache.get(key).await {
            info!("[Cache] Attendance cache HIT for key: {}", key);
            Some(entry.data)
        } else {
            info!("[Cache] Attendance cache MISS for key: {}", key);
            None
        }
    }

    pub async fn set_attendance(&self, key: String, data: serde_json::Value) {
        let entry = CacheEntry {
            data,
            timestamp: Utc::now(),
        };
        self.attendance_cache.insert(key.clone(), entry).await;
        info!("[Cache] Stored attendance data for key: {}", key);
    }

    pub async fn get_quiz(&self, key: &str) -> Option<serde_json::Value> {
        if let Some(entry) = self.quiz_cache.get(key).await {
            info!("[Cache] Quiz cache HIT for key: {}", key);
            Some(entry.data)
        } else {
            info!("[Cache] Quiz cache MISS for key: {}", key);
            None
        }
    }

    pub async fn set_quiz(&self, key: String, data: serde_json::Value) {
        let entry = CacheEntry {
            data,
            timestamp: Utc::now(),
        };
        self.quiz_cache.insert(key.clone(), entry).await;
        info!("[Cache] Stored quiz data for key: {}", key);
    }

    pub async fn get_all_attendance(&self, key: &str) -> Option<serde_json::Value> {
        if let Some(entry) = self.all_attendance_cache.get(key).await {
            info!("[Cache] All attendance cache HIT for key: {}", key);
            Some(entry.data)
        } else {
            info!("[Cache] All attendance cache MISS for key: {}", key);
            None
        }
    }

    pub async fn set_all_attendance(&self, key: String, data: serde_json::Value) {
        let entry = CacheEntry {
            data,
            timestamp: Utc::now(),
        };
        self.all_attendance_cache.insert(key.clone(), entry).await;
        info!("[Cache] Stored all attendance data for key: {}", key);
    }

    // Request deduplication for quiz endpoint
    pub async fn get_or_create_pending_request(
        &self,
        key: String,
    ) -> Result<serde_json::Value, String> {
        // Check if request is already pending
        {
            let pending = self.pending_requests.read().await;
            if let Some(sender) = pending.get(&key) {
                info!("[Cache] Waiting for pending request: {}", key);
                // Create a new channel for this request
                let (tx, rx) = tokio::sync::oneshot::channel();
                drop(pending);
                
                // Wait for the result
                match rx.await {
                    Ok(result) => return result,
                    Err(_) => {
                        warn!("[Cache] Pending request failed, creating new one: {}", key);
                    }
                }
            }
        }

    // Request deduplication is disabled in this simplified implementation.
    // Returning an Err will let the caller proceed to make the request.
    Err("dedupe_not_supported".to_string())
    }

    pub async fn complete_pending_request(&self, key: &str, result: Result<serde_json::Value, String>) {
        let mut pending = self.pending_requests.write().await;
        if let Some(sender) = pending.remove(key) {
            let _ = sender.send(result);
        }
    }

    pub async fn clear_expired(&self) {
        // Moka cache automatically handles expiration
        info!("[Cache] Cache cleanup completed");
    }

    pub async fn get_stats(&self) -> HashMap<String, u64> {
        let mut stats = HashMap::new();
        stats.insert("attendance_cache_size".to_string(), self.attendance_cache.entry_count());
        stats.insert("quiz_cache_size".to_string(), self.quiz_cache.entry_count());
        stats.insert("all_attendance_cache_size".to_string(), self.all_attendance_cache.entry_count());
        stats.insert("pending_requests".to_string(), self.pending_requests.read().await.len() as u64);
        stats
    }
}
