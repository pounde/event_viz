import { invoke } from '@tauri-apps/api/tauri';
import { EventData, EventFilter, AppInfo, ApiResult } from '../types/events';

// Event service for API communication with Rust backend
export class EventService {
  // Get all events with optional filtering
  static async getEvents(filter?: EventFilter): ApiResult<EventData[]> {
    try {
      return await invoke<EventData[]>('get_events', { filter });
    } catch (error) {
      console.error('Failed to get events:', error);
      throw error;
    }
  }

  // Create a new event
  static async createEvent(event: Omit<EventData, 'id'>): ApiResult<EventData> {
    try {
      const eventWithId = {
        ...event,
        id: crypto.randomUUID(), // Generate ID on frontend
      };
      return await invoke<EventData>('create_event', { event: eventWithId });
    } catch (error) {
      console.error('Failed to create event:', error);
      throw error;
    }
  }

  // Update an existing event
  static async updateEvent(event: EventData): ApiResult<EventData> {
    try {
      return await invoke<EventData>('update_event', { event });
    } catch (error) {
      console.error('Failed to update event:', error);
      throw error;
    }
  }

  // Delete an event
  static async deleteEvent(eventId: string): ApiResult<boolean> {
    try {
      return await invoke<boolean>('delete_event', { eventId });
    } catch (error) {
      console.error('Failed to delete event:', error);
      throw error;
    }
  }

  // Get available event categories
  static async getEventCategories(): ApiResult<string[]> {
    try {
      return await invoke<string[]>('get_event_categories');
    } catch (error) {
      console.error('Failed to get event categories:', error);
      throw error;
    }
  }

  // Get application information
  static async getAppInfo(): ApiResult<AppInfo> {
    try {
      return await invoke<AppInfo>('get_app_info');
    } catch (error) {
      console.error('Failed to get app info:', error);
      throw error;
    }
  }

  // Utility function for greeting (demo)
  static async greet(name: string): ApiResult<string> {
    try {
      return await invoke<string>('greet', { name });
    } catch (error) {
      console.error('Failed to greet:', error);
      throw error;
    }
  }
}