// TypeScript types for data source management
export interface DataSource {
  id: string;
  name: string;
  description?: string;
  sourceType: DataSourceType;
  configuration: SourceConfiguration;
  status: DataSourceStatus;
  metadata: DataSourceMetadata;
}

export type DataSourceType = 'csv' | 'json';

export type SourceConfiguration = 
  | { type: 'csv'; config: CsvConfig }
  | { type: 'json'; config: JsonConfig };

export interface CsvConfig {
  filePath: string;
  delimiter: string;
  hasHeaders: boolean;
  encoding: string;
  columnMappings: Record<string, string>;
}

export interface JsonConfig {
  filePath: string;
  rootPath?: string;
  mappings: Record<string, string>;
}

export type DataSourceStatus = 'active' | 'inactive' | { error: string };

export interface DataSourceMetadata {
  createdAt: string;
  updatedAt: string;
  lastValidated?: string;
  rowCount?: number;
  fileSize?: number;
}