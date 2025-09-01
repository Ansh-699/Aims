use std::env;
use anyhow::Result;

#[derive(Clone, Debug)]
pub struct Config {
    pub host: String,
    pub port: u16,
    pub external_api_base: String,
    pub cors_origin: String,
    pub rate_limit_per_minute: u32,
    pub request_timeout_seconds: u64,
    pub max_concurrent_requests: usize,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        Ok(Self {
            host: env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string()),
            port: env::var("PORT")
                .unwrap_or_else(|_| "3001".to_string())
                .parse()
                .unwrap_or(3001),
            external_api_base: env::var("EXTERNAL_API_BASE")
                .unwrap_or_else(|_| "https://abes.platform.simplifii.com/api/v1".to_string()),
            cors_origin: env::var("CORS_ORIGIN")
                .unwrap_or_else(|_| "http://localhost:3000".to_string()),
            rate_limit_per_minute: env::var("RATE_LIMIT_PER_MINUTE")
                .unwrap_or_else(|_| "100".to_string())
                .parse()
                .unwrap_or(100),
            request_timeout_seconds: env::var("REQUEST_TIMEOUT_SECONDS")
                .unwrap_or_else(|_| "10".to_string())
                .parse()
                .unwrap_or(10),
            max_concurrent_requests: env::var("MAX_CONCURRENT_REQUESTS")
                .unwrap_or_else(|_| "100".to_string())
                .parse()
                .unwrap_or(100),
        })
    }
}


