import React from 'react';

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-left">
        {onMenuClick && (
          <button 
            className="menu-button"
            onClick={onMenuClick}
            aria-label="Toggle menu"
          >
            <span className="menu-icon">☰</span>
          </button>
        )}
        <h1 className="header-title">{title}</h1>
      </div>
      
      <div className="header-right">
        <div className="header-info">
          Event Viz v0.1.0
        </div>
      </div>
    </header>
  );
}