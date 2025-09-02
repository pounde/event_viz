import React from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  active?: boolean;
}

const sidebarItems: SidebarItem[] = [
  { id: 'events', label: 'Events', icon: '📅', active: true },
  { id: 'calendar', label: 'Calendar', icon: '📆' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const handleItemClick = (itemId: string) => {
    console.log(`Navigation to: ${itemId}`);
    // In a real app, this would handle routing
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="sidebar-backdrop"
          onClick={onClose}
          aria-label="Close sidebar"
        />
      )}
      
      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <nav className="sidebar-nav">
          <ul className="sidebar-list">
            {sidebarItems.map((item) => (
              <li key={item.id}>
                <button
                  className={`sidebar-item ${item.active ? 'active' : ''}`}
                  onClick={() => handleItemClick(item.id)}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  <span className="sidebar-label">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="sidebar-footer">
          <div className="sidebar-item">
            <span className="sidebar-icon">ℹ️</span>
            <span className="sidebar-label">Help & Support</span>
          </div>
        </div>
      </aside>
    </>
  );
}