import { useState, useEffect, useCallback } from 'react';
import { EventData, EventFilter } from '../types/events';
import { EventService } from '../services/eventService';

interface UseEventsReturn {
  events: EventData[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createEvent: (event: Omit<EventData, 'id'>) => Promise<void>;
  updateEvent: (event: EventData) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  setFilter: (filter: EventFilter) => void;
  filter: EventFilter;
}

export function useEvents(initialFilter?: EventFilter): UseEventsReturn {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<EventFilter>(initialFilter || {});

  // Fetch events from backend
  const fetchEvents = useCallback(async (currentFilter?: EventFilter) => {
    try {
      setLoading(true);
      setError(null);
      const fetchedEvents = await EventService.getEvents(currentFilter || filter);
      setEvents(fetchedEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Refetch events manually
  const refetch = useCallback(() => fetchEvents(), [fetchEvents]);

  // Create new event
  const createEvent = useCallback(async (eventData: Omit<EventData, 'id'>) => {
    try {
      const newEvent = await EventService.createEvent(eventData);
      setEvents(prev => [...prev, newEvent]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
      throw err;
    }
  }, []);

  // Update existing event
  const updateEvent = useCallback(async (eventData: EventData) => {
    try {
      const updatedEvent = await EventService.updateEvent(eventData);
      setEvents(prev => 
        prev.map(event => 
          event.id === updatedEvent.id ? updatedEvent : event
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update event');
      throw err;
    }
  }, []);

  // Delete event
  const deleteEvent = useCallback(async (eventId: string) => {
    try {
      await EventService.deleteEvent(eventId);
      setEvents(prev => prev.filter(event => event.id !== eventId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event');
      throw err;
    }
  }, []);

  // Update filter and refetch
  const updateFilter = useCallback((newFilter: EventFilter) => {
    setFilter(newFilter);
    fetchEvents(newFilter);
  }, [fetchEvents]);

  // Initial fetch on mount and when filter changes
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    loading,
    error,
    refetch,
    createEvent,
    updateEvent,
    deleteEvent,
    setFilter: updateFilter,
    filter,
  };
}