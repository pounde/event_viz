// TypeScript interfaces matching Rust backend structures

export interface EventData {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  category: string;
  metadata: Record<string, any>;
}

export interface EventFilter {
  category?: string;
  start_date?: string;
  end_date?: string;
  search_term?: string;
}

export interface AppError {
  message: string;
  code: string;
}

export interface AppInfo {
  name: string;
  version: string;
  description: string;
}

// Event categories enum for better type safety
export const EVENT_CATEGORIES = [
  'Meeting',
  'Task',
  'Reminder', 
  'Deadline',
  'Other'
] as const;

export type EventCategory = typeof EVENT_CATEGORIES[number];

// API response wrapper
export type ApiResult<T> = Promise<T>;