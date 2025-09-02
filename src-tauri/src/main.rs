// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tracing::{info, warn, error, Level};
use tracing_subscriber;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// Data structures for event visualization
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EventData {
    pub id: String,
    pub title: String,
    pub description: String,
    pub timestamp: String,
    pub category: String,
    pub metadata: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EventFilter {
    pub category: Option<String>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub search_term: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct AppError {
    pub message: String,
    pub code: String,
}

impl From<String> for AppError {
    fn from(message: String) -> Self {
        AppError {
            message,
            code: "UNKNOWN_ERROR".to_string(),
        }
    }
}

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

// Enhanced IPC commands for event visualization
#[tauri::command]
async fn get_events(filter: Option<EventFilter>) -> Result<Vec<EventData>, AppError> {
    info!("Get events called with filter: {:?}", filter);
    
    // For now, return mock data - in a real app this would query a database
    let mut events = create_mock_events();
    
    // Apply filtering if provided
    if let Some(filter) = filter {
        events = apply_event_filter(events, filter);
    }
    
    info!("Returning {} events", events.len());
    Ok(events)
}

#[tauri::command]
async fn create_event(event: EventData) -> Result<EventData, AppError> {
    info!("Create event called: {:?}", event);
    
    // Validate event data
    if event.title.trim().is_empty() {
        let error = AppError {
            message: "Event title cannot be empty".to_string(),
            code: "VALIDATION_ERROR".to_string(),
        };
        error!("Validation failed: {}", error.message);
        return Err(error);
    }
    
    // In a real app, this would save to database
    info!("Event created successfully: {}", event.id);
    Ok(event)
}

#[tauri::command]
async fn update_event(event: EventData) -> Result<EventData, AppError> {
    info!("Update event called: {:?}", event);
    
    // Validate event data
    if event.id.trim().is_empty() {
        let error = AppError {
            message: "Event ID is required for updates".to_string(),
            code: "VALIDATION_ERROR".to_string(),
        };
        error!("Validation failed: {}", error.message);
        return Err(error);
    }
    
    // In a real app, this would update the database
    info!("Event updated successfully: {}", event.id);
    Ok(event)
}

#[tauri::command]
async fn delete_event(event_id: String) -> Result<bool, AppError> {
    info!("Delete event called with ID: {}", event_id);
    
    if event_id.trim().is_empty() {
        let error = AppError {
            message: "Event ID cannot be empty".to_string(),
            code: "VALIDATION_ERROR".to_string(),
        };
        error!("Validation failed: {}", error.message);
        return Err(error);
    }
    
    // In a real app, this would delete from database
    info!("Event deleted successfully: {}", event_id);
    Ok(true)
}

#[tauri::command]
async fn get_event_categories() -> Result<Vec<String>, AppError> {
    info!("Get event categories called");
    
    let categories = vec![
        "Meeting".to_string(),
        "Task".to_string(),
        "Reminder".to_string(),
        "Deadline".to_string(),
        "Other".to_string(),
    ];
    
    info!("Returning {} categories", categories.len());
    Ok(categories)
}

// Helper functions
fn create_mock_events() -> Vec<EventData> {
    let mut metadata = HashMap::new();
    metadata.insert("priority".to_string(), serde_json::Value::String("high".to_string()));
    
    vec![
        EventData {
            id: "1".to_string(),
            title: "Project Kickoff".to_string(),
            description: "Initial project planning meeting".to_string(),
            timestamp: "2024-01-15T10:00:00Z".to_string(),
            category: "Meeting".to_string(),
            metadata: metadata.clone(),
        },
        EventData {
            id: "2".to_string(),
            title: "Code Review".to_string(),
            description: "Review pull request #42".to_string(),
            timestamp: "2024-01-16T14:30:00Z".to_string(),
            category: "Task".to_string(),
            metadata: HashMap::new(),
        },
        EventData {
            id: "3".to_string(),
            title: "Release Deadline".to_string(),
            description: "Version 1.0 release deadline".to_string(),
            timestamp: "2024-01-20T00:00:00Z".to_string(),
            category: "Deadline".to_string(),
            metadata: metadata,
        },
    ]
}

fn apply_event_filter(events: Vec<EventData>, filter: EventFilter) -> Vec<EventData> {
    events.into_iter().filter(|event| {
        // Filter by category
        if let Some(ref category) = filter.category {
            if event.category != *category {
                return false;
            }
        }
        
        // Filter by search term
        if let Some(ref search_term) = filter.search_term {
            let search_lower = search_term.to_lowercase();
            if !event.title.to_lowercase().contains(&search_lower) 
                && !event.description.to_lowercase().contains(&search_lower) {
                return false;
            }
        }
        
        // Additional date filtering would go here
        true
    }).collect()
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
            get_events,
            create_event,
            update_event,
            delete_event,
            get_event_categories
        ])
        .setup(|app| {
            info!("Application setup complete");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}