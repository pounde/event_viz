// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod error;
mod logging;
mod commands;
mod data_source;

#[cfg(test)]
mod tests;

use error::{AppError, ErrorCategory, ErrorSeverity};
use tracing::{info, Level};
use tracing_subscriber;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    info!("Greet command called with name: {}", name);
    format!("Hello {}, you've been greeted from Rust!", name)
}

#[tauri::command]
async fn get_app_info() -> Result<serde_json::Value, String> {
    info!("App info requested");
    
    let info = serde_json::json!({
        "name": "Event Viz",
        "version": "0.1.0",
        "description": "Event visualization application built with Tauri and React"
    });
    
    Ok(info)
}

#[tauri::command]
async fn test_error_handling() -> Result<String, AppError> {
    Err(AppError::new(
        "Test error from backend".to_string(),
        ErrorCategory::System,
        ErrorSeverity::Error,
    ))
}

#[tauri::command]
async fn validate_input(input: String) -> Result<String, AppError> {
    if input.is_empty() {
        return Err(AppError::new(
            "Input cannot be empty".to_string(),
            ErrorCategory::Validation,
            ErrorSeverity::Warning,
        ));
    }
    if input.len() > 100 {
        return Err(AppError::new(
            "Input too long".to_string(),
            ErrorCategory::Validation,
            ErrorSeverity::Warning,
        ));
    }
    Ok(format!("Valid input: {}", input))
}

fn setup_logging() {
    tracing_subscriber::fmt()
        .with_max_level(Level::INFO)
        .with_target(false)
        .with_thread_ids(true)
        .with_file(true)
        .with_line_number(true)
        .init();
}

fn main() {
    setup_logging();
    info!("Starting Event Viz application");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_app_info,
            test_error_handling,
            validate_input
        ])
        .setup(|app| {
            info!("Application setup complete");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}