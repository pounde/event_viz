import React, { useState } from 'react';
import { useEvents } from '../hooks/useEvents';
import { EventData, EventFilter } from '../types/events';

export function EventsDashboard() {
  const { 
    events, 
    loading, 
    error, 
    refetch, 
    createEvent, 
    updateEvent, 
    deleteEvent,
    setFilter,
    filter 
  } = useEvents();

  const [searchTerm, setSearchTerm] = useState(filter.search_term || '');
  const [selectedCategory, setSelectedCategory] = useState(filter.category || '');

  // Handle search
  const handleSearch = () => {
    setFilter({
      ...filter,
      search_term: searchTerm || undefined,
      category: selectedCategory || undefined,
    });
  };

  // Handle event deletion with confirmation
  const handleDelete = async (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteEvent(eventId);
      } catch (error) {
        console.error('Failed to delete event:', error);
      }
    }
  };

  // Format timestamp for display
  const formatDate = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h3>❌ Error Loading Events</h3>
        <p>{error}</p>
        <button onClick={refetch} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="events-dashboard">
      <div className="dashboard-header">
        <h2>📅 Events Dashboard</h2>
        <p>Manage and visualize your events</p>
      </div>

      {/* Search and Filter Controls */}
      <div className="dashboard-controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
          >
            <option value="">All Categories</option>
            <option value="Meeting">Meeting</option>
            <option value="Task">Task</option>
            <option value="Reminder">Reminder</option>
            <option value="Deadline">Deadline</option>
            <option value="Other">Other</option>
          </select>
          <button onClick={handleSearch} className="search-button">
            🔍 Search
          </button>
          <button onClick={refetch} className="refresh-button">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="events-section">
        <div className="events-header">
          <h3>Events ({events.length})</h3>
        </div>

        {events.length === 0 ? (
          <div className="no-events">
            <p>📭 No events found</p>
            {(searchTerm || selectedCategory) && (
              <button onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                setFilter({});
              }}>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="events-grid">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onUpdate={updateEvent}
                onDelete={() => handleDelete(event.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Event Card Component
interface EventCardProps {
  event: EventData;
  onUpdate: (event: EventData) => Promise<void>;
  onDelete: () => void;
}

function EventCard({ event, onUpdate, onDelete }: EventCardProps) {
  const formatDate = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      Meeting: '👥',
      Task: '✅',
      Reminder: '⏰',
      Deadline: '🎯',
      Other: '📝',
    };
    return icons[category] || '📝';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Meeting: '#4CAF50',
      Task: '#2196F3',
      Reminder: '#FF9800',
      Deadline: '#F44336',
      Other: '#9C27B0',
    };
    return colors[category] || '#757575';
  };

  return (
    <div className="event-card">
      <div className="event-header">
        <div className="event-category" style={{ color: getCategoryColor(event.category) }}>
          <span className="category-icon">{getCategoryIcon(event.category)}</span>
          <span className="category-label">{event.category}</span>
        </div>
        <div className="event-actions">
          <button 
            className="action-button edit-button"
            onClick={() => console.log('Edit event:', event.id)}
            title="Edit event"
          >
            ✏️
          </button>
          <button 
            className="action-button delete-button"
            onClick={onDelete}
            title="Delete event"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="event-content">
        <h4 className="event-title">{event.title}</h4>
        <p className="event-description">{event.description}</p>
        <div className="event-timestamp">
          📅 {formatDate(event.timestamp)}
        </div>
      </div>

      {Object.keys(event.metadata).length > 0 && (
        <div className="event-metadata">
          <strong>Additional Info:</strong>
          {Object.entries(event.metadata).map(([key, value]) => (
            <div key={key} className="metadata-item">
              <span className="metadata-key">{key}:</span>
              <span className="metadata-value">{String(value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}