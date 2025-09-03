use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataSource {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub source_type: DataSourceType,
    pub configuration: SourceConfiguration,
    pub status: DataSourceStatus,
    pub metadata: DataSourceMetadata,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DataSourceType {
    Csv,
    Json,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SourceConfiguration {
    Csv(CsvConfig),
    Json(JsonConfig),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CsvConfig {
    pub file_path: String,
    pub delimiter: String,
    pub has_headers: bool,
    pub encoding: String,
    pub column_mappings: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonConfig {
    pub file_path: String,
    pub root_path: Option<String>,
    pub mappings: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DataSourceStatus {
    Active,
    Inactive,
    Error(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataSourceMetadata {
    pub created_at: String,
    pub updated_at: String,
    pub last_validated: Option<String>,
    pub row_count: Option<usize>,
    pub file_size: Option<u64>,
}