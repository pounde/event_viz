#[cfg(test)]
mod tests {
    use super::*;
    use crate::error::{AppError, ErrorCategory, ErrorSeverity};
    
    #[test]
    fn test_app_error_creation() {
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
    fn test_error_from_message() {
        // Test network error detection
        let network_error = AppError::from_message("Network connection failed");
        assert_eq!(network_error.category(), &ErrorCategory::Network);
        
        // Test validation error detection
        let validation_error = AppError::from_message("Invalid input format");
        assert_eq!(validation_error.category(), &ErrorCategory::Validation);
        
        // Test file system error detection
        let fs_error = AppError::from_message("File not found");
        assert_eq!(fs_error.category(), &ErrorCategory::FileSystem);
    }
    
    #[test]
    fn test_error_context() {
        let mut error = AppError::new(
            "Test error".to_string(),
            ErrorCategory::System,
            ErrorSeverity::Error,
        );
        
        error.with_context("user_id", "12345");
        error.with_context("operation", "test_operation");
        
        let context = error.context();
        assert_eq!(context.get("user_id"), Some(&"12345".to_string()));
        assert_eq!(context.get("operation"), Some(&"test_operation".to_string()));
    }
    
    #[test]
    fn test_error_sanitization() {
        let tests = vec![
            ("Database error: password=secret123", "Database error: password=***"),
            ("API failed: api_key=xyz789", "API failed: api_key=***"),
            ("Token invalid: token=abc456", "Token invalid: token=***"),
        ];
        
        for (input, expected) in tests {
            let error = AppError::from_message(input);
            let sanitized = error.sanitized_message();
            assert_eq!(sanitized, expected);
        }
    }
    
    #[test]
    fn test_recovery_suggestions() {
        let network_error = AppError::new(
            "Connection timeout".to_string(),
            ErrorCategory::Network,
            ErrorSeverity::Error,
        );
        
        let suggestions = network_error.recovery_suggestions();
        assert!(suggestions.contains(&"Retry the operation".to_string()));
        assert!(suggestions.contains(&"Check network connectivity".to_string()));
        
        let validation_error = AppError::new(
            "Invalid format".to_string(),
            ErrorCategory::Validation,
            ErrorSeverity::Warning,
        );
        
        let suggestions = validation_error.recovery_suggestions();
        assert!(suggestions.contains(&"Validate input format".to_string()));
    }
    
    #[test]
    fn test_error_severity() {
        let critical_error = AppError::from_message("System crash imminent");
        assert_eq!(critical_error.severity(), &ErrorSeverity::Critical);
        
        let warning_error = AppError::from_message("Deprecated API warning");
        assert_eq!(warning_error.severity(), &ErrorSeverity::Warning);
        
        let info_error = AppError::from_message("Operation completed with minor issues");
        assert_eq!(info_error.severity(), &ErrorSeverity::Info);
    }
    
    #[test]
    fn test_error_from_io() {
        let io_error = std::io::Error::new(
            std::io::ErrorKind::NotFound,
            "File not found"
        );
        
        let app_error = AppError::from_io_error(io_error);
        assert_eq!(app_error.category(), &ErrorCategory::FileSystem);
        assert!(app_error.message().contains("File not found"));
    }
}