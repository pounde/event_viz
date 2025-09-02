import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ErrorBoundary } from '../ErrorBoundary';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function MainLayout({ children, title = 'Event Viz' }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="main-layout">
      <Header 
        title={title}
        onMenuClick={toggleSidebar}
      />
      
      <div className="layout-body">
        <Sidebar 
          isOpen={sidebarOpen}
          onClose={closeSidebar}
        />
        
        <main className="main-content">
          <ErrorBoundary>
            <div className="content-wrapper">
              {children}
            </div>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}