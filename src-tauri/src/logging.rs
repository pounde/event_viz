use std::fs::{File, OpenOptions};
use std::io::{self, Write};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub enum LogLevel {
    Debug,
    Info,
    Warn,
    Error,
    Critical,
}

impl std::fmt::Display for LogLevel {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            LogLevel::Debug => write!(f, "DEBUG"),
            LogLevel::Info => write!(f, "INFO"),
            LogLevel::Warn => write!(f, "WARN"),
            LogLevel::Error => write!(f, "ERROR"),
            LogLevel::Critical => write!(f, "CRITICAL"),
        }
    }
}

pub trait Logger: Send + Sync {
    fn log(&self, level: LogLevel, message: &str);
}

pub struct FileLogger {
    file: Arc<Mutex<File>>,
    min_level: LogLevel,
}

impl FileLogger {
    pub fn new(path: PathBuf, min_level: LogLevel) -> io::Result<Self> {
        let file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(path)?;
        
        Ok(Self {
            file: Arc::new(Mutex::new(file)),
            min_level,
        })
    }

    pub fn with_rotation(
        path: PathBuf,
        min_level: LogLevel,
        _max_size: usize,
        _max_files: usize,
    ) -> io::Result<Self> {
        // Simplified version - just create a regular file logger
        Self::new(path, min_level)
    }

    pub fn flush(&self) -> io::Result<()> {
        self.file.lock().unwrap().flush()
    }
}

impl Logger for FileLogger {
    fn log(&self, level: LogLevel, message: &str) {
        if level < self.min_level {
            return;
        }

        let timestamp = chrono::Utc::now().to_rfc3339();
        let log_entry = format!("[{}] [{}] {}\n", timestamp, level, message);
        
        if let Ok(mut file) = self.file.lock() {
            let _ = file.write_all(log_entry.as_bytes());
        }
    }
}

pub struct StructuredLogger {
    file_logger: FileLogger,
    context: Arc<Mutex<HashMap<String, String>>>,
}

use std::collections::HashMap;

impl StructuredLogger {
    pub fn new(path: PathBuf, min_level: LogLevel) -> io::Result<Self> {
        Ok(Self {
            file_logger: FileLogger::new(path, min_level)?,
            context: Arc::new(Mutex::new(HashMap::new())),
        })
    }

    pub fn set_context(&mut self, key: &str, value: &str) {
        if let Ok(mut ctx) = self.context.lock() {
            ctx.insert(key.to_string(), value.to_string());
        }
    }

    pub fn log(&self, level: LogLevel, message: &str) {
        self.file_logger.log(level, message);
    }

    pub fn log_structured(&mut self, level: LogLevel, message: &str, fields: &[(&str, &str)]) {
        let mut log_message = format!("{}", message);
        for (key, value) in fields {
            log_message.push_str(&format!(" {}={}", key, value));
        }
        self.file_logger.log(level, &log_message);
    }

    pub fn flush(&self) -> io::Result<()> {
        self.file_logger.flush()
    }
}

pub fn init_logging() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info"));

    tracing_subscriber::registry()
        .with(filter)
        .with(fmt::layer().with_target(false))
        .init();

    tracing::info!("Logging initialized");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_log_level_ordering() {
        assert!(LogLevel::Debug < LogLevel::Info);
        assert!(LogLevel::Info < LogLevel::Warn);
        assert!(LogLevel::Warn < LogLevel::Error);
        assert!(LogLevel::Error < LogLevel::Critical);
    }

    #[test]
    fn test_file_logger_creation() {
        let temp_dir = TempDir::new().unwrap();
        let log_path = temp_dir.path().join("test.log");
        
        let logger = FileLogger::new(log_path.clone(), LogLevel::Info).unwrap();
        logger.log(LogLevel::Info, "Test log message");
        logger.flush().unwrap();

        let log_content = std::fs::read_to_string(log_path).unwrap();
        assert!(log_content.contains("Test log message"));
        assert!(log_content.contains("[INFO]"));
    }
}