# Error Handling and Logging API Documentation

## Overview

This document provides comprehensive API documentation for the error handling and logging systems implemented in the Event Visualization application.

## Backend Error Handling (Rust)

### Error Types

The application uses a custom `AppError` enum for all error handling:

```rust
use crate::error::{AppError, ErrorCategory, ErrorSeverity};
```

### Creating Errors

```rust
// Validation errors
let error = AppError::new(
    "Username must be at least 3 characters".to_string(),
    ErrorCategory::Validation,
    ErrorSeverity::Warning,
);

// Network errors
let error = AppError::new(
    "Connection timeout".to_string(),
    ErrorCategory::Network,
    ErrorSeverity::Error,
);

// Using convenience methods
let error = AppError::from_message("Failed to parse JSON");
let error = AppError::from_io_error(io_error);
```

### Error Categories

- `Network` - Network-related errors
- `Validation` - Input validation failures
- `FileSystem` - File I/O errors
- `Database` - Database operations
- `System` - Internal system errors
- `Cache` - Cache-related errors
- `Processing` - Data processing errors
- `Unknown` - Unclassified errors

### Error Severity Levels

- `Debug` - Diagnostic information
- `Info` - Informational messages
- `Warning` - Non-critical issues
- `Error` - Errors affecting functionality
- `Critical` - System failures

### Error Context

Add context to errors for better debugging:

```rust
let mut error = AppError::new(
    "Operation failed".to_string(),
    ErrorCategory::System,
    ErrorSeverity::Error,
);

error.with_context("user_id", "12345")
     .with_context("operation", "data_export")
     .with_context("timestamp", &timestamp.to_string());
```

### Error Recovery

Get recovery suggestions for errors:

```rust
let suggestions = error.recovery_suggestions();
// Returns Vec<String> with recovery steps
```

### Error Sanitization

Remove sensitive data from error messages:

```rust
let sanitized = error.sanitized_message();
// Automatically removes passwords, API keys, etc.
```

## Frontend Error Handling (React/TypeScript)

### Error Handler Utility

```typescript
import { ErrorHandler, ErrorSeverity, ErrorCategory } from '@/utils/errorHandler';

const handler = new ErrorHandler({
  enableConsoleLogging: true,
  logFunction: (error) => {
    // Custom logging logic
  }
});

handler.handleError(error, {
  severity: ErrorSeverity.ERROR,
  category: ErrorCategory.NETWORK,
  context: {
    userId: '123',
    action: 'fetch_data'
  }
});
```

### useErrorHandler Hook

```typescript
import { useErrorHandler } from '@/hooks/useErrorHandler';

function MyComponent() {
  const {
    lastError,
    hasError,
    isLoading,
    handleError,
    clearError,
    withErrorHandling
  } = useErrorHandler({
    defaultSeverity: ErrorSeverity.WARNING,
    defaultCategory: ErrorCategory.VALIDATION,
    showToast: true
  });

  // Handle errors manually
  try {
    await riskyOperation();
  } catch (error) {
    handleError(error, { userId: currentUser.id });
  }

  // Or use the wrapper
  const result = await withErrorHandling(async () => {
    return await riskyOperation();
  });
}
```

### Error Boundary Component

```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary fallback={<CustomErrorUI />}>
      <YourApplication />
    </ErrorBoundary>
  );
}
```

The ErrorBoundary component:
- Catches React component errors
- Displays user-friendly error messages
- Shows stack traces in development
- Provides retry functionality

## IPC Error Handling

### Safe IPC Invocation

```typescript
import { IPCErrorHandler } from '@/utils/ipcErrorHandler';

const ipc = new IPCErrorHandler();

// Basic invocation
const result = await ipc.safeInvoke('command_name', { 
  param: 'value' 
});

// With timeout and retry
const result = await ipc.safeInvoke(
  'command_name',
  { param: 'value' },
  5000,  // 5 second timeout
  3      // 3 retry attempts
);

if (result.success) {
  console.log('Data:', result.data);
} else {
  console.error('Error:', result.error);
}
```

### Error Categories for IPC

- `CONNECTION` - Backend connection issues
- `PERMISSION` - Permission denied errors
- `VALIDATION` - Invalid parameters
- `TIMEOUT` - Operation timeout
- `UNKNOWN` - Unclassified IPC errors

## Logging API

### Backend Logging (Rust)

```rust
use crate::logging::{Logger, LogLevel};
use tracing::{info, warn, error, debug};

// Simple logging
info!("User logged in");
warn!("Deprecated API usage");
error!("Operation failed: {}", error_msg);
debug!("Debug information: {:?}", data);

// Structured logging
info!(
    user_id = %user.id,
    action = "export",
    format = "csv",
    duration_ms = elapsed.as_millis(),
    "Data export completed"
);

// Logging with error context
Logger::log_error(&app_error, Some(json!({
    "operation": "file_read",
    "path": file_path
})));

// Performance logging
Logger::log_operation_success(
    "data_processing",
    duration,
    Some(json!({ "records": 1000 }))
);
```

### Frontend Logging (React)

```typescript
import { useErrorHandler } from '@/hooks/useErrorHandler';

function MyComponent() {
  const { logDebug, logInfo, logWarn, logError } = useErrorHandler();

  // Debug logging
  logDebug('Component mounted', { 
    props, 
    state 
  });

  // Info logging
  logInfo('User action', { 
    action: 'button_click',
    timestamp: Date.now() 
  });

  // Warning logging
  logWarn('Slow operation', { 
    duration_ms: 5000,
    threshold_ms: 1000 
  });

  // Error logging
  logError('Operation failed', { 
    error: error.message,
    stack: error.stack,
    context: additionalContext 
  });
}
```

## Best Practices

### Error Handling

1. **Always provide context**: Include relevant data when creating errors
2. **Use appropriate severity levels**: Don't mark everything as ERROR
3. **Sanitize sensitive data**: Never log passwords, tokens, or API keys
4. **Provide recovery suggestions**: Help users resolve issues

### Logging

1. **Structure your logs**: Use consistent field names
2. **Log at appropriate levels**: Use DEBUG for development, INFO for operations
3. **Include timing information**: Log duration for performance monitoring
4. **Avoid excessive logging**: Don't log in tight loops
5. **Use correlation IDs**: Track related operations across logs

### Performance Considerations

1. **Async error handling**: Don't block on error logging
2. **Batch log writes**: Group multiple log entries when possible
3. **Use appropriate log levels**: Filter unnecessary logs in production
4. **Monitor log size**: Implement log rotation

## Examples

### Complete Error Flow Example

```typescript
// Frontend
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { IPCErrorHandler } from '@/utils/ipcErrorHandler';

function DataExporter() {
  const { logInfo, logError, withErrorHandling } = useErrorHandler();
  const ipc = new IPCErrorHandler();

  const exportData = async () => {
    const startTime = performance.now();
    
    logInfo('Starting data export', { 
      format: 'csv',
      userId: currentUser.id 
    });

    const result = await withErrorHandling(async () => {
      return await ipc.safeInvoke('export_data', {
        format: 'csv',
        includeHeaders: true
      }, 30000, 2);
    });

    if (result) {
      const duration = performance.now() - startTime;
      logInfo('Export completed', { 
        duration_ms: Math.round(duration),
        records: result.recordCount 
      });
    } else {
      logError('Export failed', { 
        duration_ms: Math.round(performance.now() - startTime) 
      });
    }
  };
}
```

```rust
// Backend
#[tauri::command]
async fn export_data(format: String, include_headers: bool) -> Result<ExportResult, AppError> {
    let start = std::time::Instant::now();
    
    info!(
        format = %format,
        include_headers = include_headers,
        "Starting data export"
    );
    
    match perform_export(&format, include_headers).await {
        Ok(result) => {
            Logger::log_operation_success(
                "export_data",
                start.elapsed(),
                Some(json!({
                    "format": format,
                    "records": result.record_count
                }))
            );
            Ok(result)
        }
        Err(e) => {
            Logger::log_error(&e, Some(json!({
                "format": format,
                "duration_ms": start.elapsed().as_millis()
            })));
            Err(e)
        }
    }
}
```

## Testing

### Testing Error Handling

```rust
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
    let error = AppError::from_message("Failed: password=secret123");
    let sanitized = error.sanitized_message();
    
    assert!(!sanitized.contains("secret123"));
    assert!(sanitized.contains("***"));
}
```

```typescript
// Frontend tests
import { renderHook, act } from '@testing-library/react';
import { useErrorHandler } from '@/hooks/useErrorHandler';

test('handles errors with context', () => {
  const { result } = renderHook(() => useErrorHandler());
  
  act(() => {
    result.current.handleError(new Error('Test error'), {
      userId: '123'
    });
  });
  
  expect(result.current.hasError).toBe(true);
  expect(result.current.lastError?.message).toBe('Test error');
});
```