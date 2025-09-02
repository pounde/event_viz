import React from 'react';
import { MainLayout } from './components/Layout/MainLayout';
import { EventsDashboard } from './components/EventsDashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import './App.css';
import './styles/layout.css';
import './styles/dashboard.css';

function App() {
  return (
    <ErrorBoundary>
      <MainLayout title="Event Viz">
        <EventsDashboard />
      </MainLayout>
    </ErrorBoundary>
  );
}

export default App;