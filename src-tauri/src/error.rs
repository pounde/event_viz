/// Error handling module for the Event Visualization application.
/// 
/// This module provides a comprehensive error handling system with:
/// - Categorized error types for different failure scenarios
/// - Severity levels for error prioritization
/// - Context preservation for debugging
/// - Automatic sanitization of sensitive data
/// - Recovery suggestions for common errors
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use thiserror::Error;

/// Categories of errors that can occur in the application
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ErrorCategory {
    Network,
    Validation,
    FileSystem,
    Database,
    System,
    Cache,
    Processing,
    Unknown,
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub enum ErrorSeverity {
    Debug,
    Info,
    Warning,
    Error,
    Critical,
}

#[derive(Debug, Error, Serialize, Deserialize, Clone)]
pub struct AppError {
    message: String,
    #[serde(skip)]
    category: ErrorCategory,
    #[serde(skip)]
    severity: ErrorSeverity,
    context: HashMap<String, String>,
    timestamp: std::time::SystemTime,
}

impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl AppError {
    /// Creates a new AppError with the specified message, category, and severity.
    /// 
    /// # Arguments
    /// * `message` - The error message
    /// * `category` - The error category for classification
    /// * `severity` - The severity level of the error
    /// 
    /// # Example
    /// ```rust
    /// let error = AppError::new(
    ///     "Connection timeout".to_string(),
    ///     ErrorCategory::Network,
    ///     ErrorSeverity::Error,
    /// );
    /// ```
    pub fn new(message: String, category: ErrorCategory, severity: ErrorSeverity) -> Self {
        Self {
            message,
            category,
            severity,
            context: HashMap::new(),
            timestamp: std::time::SystemTime::now(),
        }
    }

    pub fn from_message(message: &str) -> Self {
        let category = Self::categorize_message(message);
        let severity = Self::assess_severity(message);
        Self::new(message.to_string(), category, severity)
    }

    pub fn from_io_error(err: std::io::Error) -> Self {
        Self::new(err.to_string(), ErrorCategory::FileSystem, ErrorSeverity::Error)
    }

    pub fn with_context(&mut self, key: &str, value: &str) -> &mut Self {
        self.context.insert(key.to_string(), value.to_string());
        self
    }

    pub fn message(&self) -> &str {
        &self.message
    }

    pub fn category(&self) -> &ErrorCategory {
        &self.category
    }

    pub fn severity(&self) -> &ErrorSeverity {
        &self.severity
    }

    pub fn context(&self) -> &HashMap<String, String> {
        &self.context
    }

    pub fn timestamp(&self) -> std::time::SystemTime {
        self.timestamp
    }

    pub fn recovery_suggestions(&self) -> Vec<String> {
        match self.category {
            ErrorCategory::Network => vec![
                "Retry the operation".to_string(),
                "Check network connectivity".to_string(),
            ],
            ErrorCategory::Validation => vec![
                "Validate input format".to_string(),
                "Check field requirements".to_string(),
            ],
            _ => vec![],
        }
    }

    pub fn error_chain(&self) -> Vec<String> {
        vec![self.message.clone()]
    }

    pub fn sanitized_message(&self) -> String {
        let mut sanitized = self.message.clone();
        // Remove potential passwords or API keys
        sanitized = sanitized.replace(
            |c: char| c == '=' || c == ':',
            |s: &str| {
                if s.contains("password") || s.contains("api_key") || s.contains("secret") {
                    return "***";
                }
                s
            },
        );
        
        // Simple sanitization - replace anything after password=, api_key=, etc.
        let patterns = vec!["password=", "api_key=", "secret=", "token="];
        for pattern in patterns {
            if let Some(idx) = sanitized.find(pattern) {
                let start = idx + pattern.len();
                if let Some(end_idx) = sanitized[start..].find(|c: char| c.is_whitespace() || c == ',' || c == ';') {
                    let end = start + end_idx;
                    sanitized.replace_range(start..end, "***");
                } else {
                    sanitized.replace_range(start.., "***");
                }
            }
        }
        sanitized
    }

    pub fn log_with_logger(&self, logger: std::sync::Arc<dyn std::any::Any + Send + Sync>) {
        // This would integrate with the actual logger
        // For now, just print to stderr
        eprintln!("[{:?}] {}", self.severity, self.message);
    }

    fn categorize_message(message: &str) -> ErrorCategory {
        let lower = message.to_lowercase();
        if lower.contains("network") || lower.contains("connection") || lower.contains("timeout") {
            ErrorCategory::Network
        } else if lower.contains("invalid") || lower.contains("validation") || lower.contains("required") {
            ErrorCategory::Validation
        } else if lower.contains("file") || lower.contains("not found") {
            ErrorCategory::FileSystem
        } else if lower.contains("database") {
            ErrorCategory::Database
        } else {
            ErrorCategory::Unknown
        }
    }

    fn assess_severity(message: &str) -> ErrorSeverity {
        let lower = message.to_lowercase();
        if lower.contains("crash") || lower.contains("critical") {
            ErrorSeverity::Critical
        } else if lower.contains("deprecated") || lower.contains("warning") {
            ErrorSeverity::Warning
        } else if lower.contains("completed") || lower.contains("minor") {
            ErrorSeverity::Info
        } else {
            ErrorSeverity::Error
        }
    }
}

pub struct ErrorMetrics {
    total_errors: usize,
    errors_by_category: HashMap<ErrorCategory, usize>,
    errors_by_severity: HashMap<ErrorSeverity, usize>,
}

impl ErrorMetrics {
    pub fn new() -> Self {
        Self {
            total_errors: 0,
            errors_by_category: HashMap::new(),
            errors_by_severity: HashMap::new(),
        }
    }

    pub fn record_error(&mut self, error: &AppError) {
        self.total_errors += 1;
        *self.errors_by_category.entry(error.category.clone()).or_insert(0) += 1;
        *self.errors_by_severity.entry(error.severity.clone()).or_insert(0) += 1;
    }

    pub fn get_stats(&self) -> ErrorStats {
        ErrorStats {
            total_errors: self.total_errors,
            errors_by_category: self.errors_by_category.clone(),
            errors_by_severity: self.errors_by_severity.clone(),
        }
    }
}

pub struct ErrorStats {
    pub total_errors: usize,
    pub errors_by_category: HashMap<ErrorCategory, usize>,
    pub errors_by_severity: HashMap<ErrorSeverity, usize>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_creation() {
        let error = AppError::new(
            "Test error".to_string(),
            ErrorCategory::Validation,
            ErrorSeverity::Warning,
        );
        assert_eq!(error.message(), "Test error");
        assert_eq!(error.category(), &ErrorCategory::Validation);
        assert_eq!(error.severity(), &ErrorSeverity::Warning);
    }

    #[test]
    fn test_error_sanitization() {
        let error = AppError::from_message("Database connection failed: password=secret123");
        let sanitized = error.sanitized_message();
        assert!(!sanitized.contains("secret123"));
        assert!(sanitized.contains("***"));
    }
}