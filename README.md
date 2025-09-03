# Tauri 3D Event Debriefing Application - Technical Specification

## Quickstart

### Prerequisites

- [Rust](https://rustup.rs/) 1.89.0 or later
- [Node.js](https://nodejs.org/) 22 LTS
- Platform-specific build tools:
  - **Windows**: Microsoft Visual Studio C++ Build Tools
  - **macOS**: Xcode Command Line Tools
  - **Linux**: Build essentials (gcc, cmake)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd event_viz
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm run tauri dev
   ```

### Build for production

```bash
npm run tauri build
```

The built application will be available in `src-tauri/target/release/bundle/`.

### Project Structure

- `src/` - React frontend source code
- `src-tauri/` - Rust backend source code
- `public/` - Static assets
- `dist/` - Built frontend assets (generated)

## Overview

Build a barebones Tauri-based 3D event debriefing application using a plugin-first architecture where ALL functionality is implemented as plugins, including first-party components. The core system provides only the plugin runtime, UI framework, and file management, with React/Three.js frontend and Rust backend supporting both directory and compressed project formats.

## Architecture Decisions

### Plugin-First Everything

Core system is merely a plugin host - all data import, processing, visualization, and export functionality implemented as plugins using the same APIs third-parties will use.

### Technology Choices

- **Tauri 2.8.4**: Cross-platform desktop framework with Rust backend
- **React 19.1.0 + TypeScript 5.9.2**: Modern frontend with latest stable features
- **Three.js 0.179.1**: 3D visualization engine with WebGL 2.0
- **Node.js 22 LTS**: Production-ready runtime for development tools

### Core Design Patterns

- **Plugin System**: Trait-based plugin architecture with JSON message passing
- **Event-Driven Architecture**: Plugin communication via event bus
- **Real-time Auto-save**: All changes persisted within 1 second, manual save for confirmation
- **Dual Project Formats**: Native directory structure + compressed archives for distribution

## Technical Approach

### Frontend Components

#### Core UI Framework (React)

- Layout manager with configurable panels (3D viewport 60%, timeline 15%, event panel 15%, data panel 10%)
- Plugin registration and management interface
- Real-time validation feedback system
- Project format detection and handling

#### 3D Visualization Engine (Three.js)

- WebGL 2.0 renderer with basic scene management
- Camera controller (orbit, first-person, top-down modes)
- Plugin-extensible entity rendering system
- Timeline synchronization for temporal navigation

#### Plugin Host Interface

- Hot-loading plugin discovery and registration
- Standardized plugin API communication layer
- UI extension points for plugin-provided components
- Configuration panels for plugin parameters

### Backend Services

#### Plugin Runtime (Rust)

- Trait-based plugin system with version compatibility
- Sandboxed execution environment with capability-based permissions
- Plugin dependency resolution and lifecycle management
- JSON-based message passing between core and plugins

#### File System Management

- Project directory structure creation and validation
- Archive compression/extraction for project distribution
- Real-time file watching and auto-save implementation
- Scene file validation against JSON schema

#### Python Integration Layer

- Subprocess execution for Python-based data processing plugins
- Secure inter-process communication
- Error handling and timeout management

### Infrastructure

#### Development Environment

- Vite-based build system for fast development
- Cross-platform compilation targets (Windows, macOS, Linux)
- Plugin SDK for third-party developers

#### Distribution

- Native installers for each platform
- Plugin marketplace preparation (directory structure)
- Documentation system integration

## Implementation Strategy

### Phase 1: Core Infrastructure (Weeks 1-3)

- Tauri application shell with React frontend
- Basic plugin system with trait definitions
- File system management and project formats
- Core UI layout with panel system

### Phase 2: First-Party Plugins (Weeks 4-6)

- Essential data importer plugins (GPS, audio, transcripts)
- Basic 3D visualization plugins
- Timeline and event panel plugins
- Project management plugins

### Phase 3: Integration & Polish (Weeks 7-8)

- Plugin hot-loading and configuration
- Real-time auto-save implementation
- Performance optimization and testing
- Documentation and sample projects

### Risk Mitigation

- Start with simplest possible plugin architecture
- Use existing Three.js patterns rather than custom abstractions
- Minimize Python integration complexity initially
- Focus on directory format first, add compression later

### Testing Approach

- Unit tests for plugin system components
- Integration tests for file format handling
- Performance benchmarks for 3D rendering
- Cross-platform compatibility validation

## Error Handling and Logging

### Error Handling System

The application implements a comprehensive error handling system that provides consistent error management across both Rust backend and React frontend.

#### Backend Error Types (Rust)

```rust
use crate::error::AppError;

// Create specific error types
AppError::validation("Input cannot be empty")
AppError::network("Connection timeout")
AppError::io("File not found")
```

**Available Error Categories:**
- `Network` - Connection failures, timeouts
- `Validation` - Input validation errors
- `FileSystem` - File I/O operations
- `Database` - Data persistence issues
- `System` - Internal application errors

#### Frontend Error Handling (React)

```typescript
import { useErrorHandler } from '@/hooks/useErrorHandler';

function MyComponent() {
  const { handleError, withErrorHandling } = useErrorHandler();
  
  const riskyOperation = async () => {
    await withErrorHandling(async () => {
      // Your async operation
      await someApiCall();
    });
  };
}
```

**Error Boundary Integration:**
```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### Logging System

The application provides structured logging with multiple severity levels for both development and production environments.

#### Log Levels

- `DEBUG` - Detailed diagnostic information
- `INFO` - General operational messages
- `WARN` - Warning conditions
- `ERROR` - Error conditions affecting functionality
- `CRITICAL` - System failures requiring immediate attention

#### Backend Logging (Rust)

```rust
use tracing::{info, warn, error, debug};

// Simple logging
info!("Operation completed successfully");
warn!("Deprecated API usage detected");
error!("Failed to process request: {}", error_msg);

// Structured logging with context
info!(
    user_id = %user.id,
    action = "export",
    format = "csv",
    "User initiated data export"
);
```

#### Frontend Logging (React)

```typescript
import { useErrorHandler } from '@/hooks/useErrorHandler';

function MyComponent() {
  const { logInfo, logError, logWarn } = useErrorHandler();
  
  const handleExport = async () => {
    logInfo('Starting data export', { format: 'csv' });
    
    try {
      await exportData();
      logInfo('Export completed successfully');
    } catch (error) {
      logError('Export failed', { error: error.message });
    }
  };
}
```

### IPC Error Handling

Tauri IPC commands implement automatic error handling with retry logic:

```typescript
import { IPCErrorHandler } from '@/utils/ipcErrorHandler';

const ipcHandler = new IPCErrorHandler();

// Automatic retry with timeout
const result = await ipcHandler.safeInvoke(
  'command_name',
  { param: 'value' },
  5000,  // 5 second timeout
  3      // 3 retry attempts
);

if (result.success) {
  console.log('Success:', result.data);
} else {
  console.error('Failed:', result.error);
}
```

### Error Recovery

The system includes automatic error recovery mechanisms:

1. **Retry Logic** - Network errors automatically retry with exponential backoff
2. **Fallback Handlers** - Graceful degradation when features fail
3. **Error Boundaries** - Prevent React component crashes from affecting the entire app
4. **Sanitization** - Sensitive data is automatically removed from error messages

### Development vs Production

**Development Mode:**
- Full stack traces in error messages
- Verbose logging to console
- Error details in UI for debugging

**Production Mode:**
- User-friendly error messages
- Error reporting to logging service
- Minimal console output
- Sensitive data sanitization

## Task Summary

**Total Tasks Created**: 10 essential tasks for MVP implementation

### Core Foundation (Critical Path)

- **01-tauri-app-shell** (5 days): Foundational Tauri application with React frontend
- **02-plugin-system-architecture** (8 days): Core plugin system with Rust traits and JSON messaging
- **03-file-project-management** (4 days): Project directory structure and archive support
- **04-threejs-integration** (6 days): 3D visualization engine with plugin-extensible rendering

### First-Party Plugin Implementations

- **05-data-importer-plugins** (7 days): GPS, audio, and transcript importer plugins
- **06-visualization-plugins** (6 days): 3D visualization plugins for GPS tracks, audio waveforms, and transcripts
- **07-ui-framework-plugins** (5 days): Timeline control, event panel, and project manager UI plugins

### System Integration & Polish

- **08-real-time-autosave** (3 days): Auto-save system with file watching and manual save points
- **09-cross-platform-distribution** (4 days): Build system, native installers, and CI/CD pipeline
- **10-performance-optimization** (4 days): Memory management, rendering optimization, and plugin profiling

**Total Estimated Effort**: 52 days (approximately 8 weeks with parallel development)

### Task Dependencies

- Tasks 01-04 form the critical path foundation
- Plugin tasks (05-07) can be developed in parallel after task 02
- Integration tasks (08-10) depend on core functionality completion

### Key Deliverables

- Plugin-first architecture with all functionality delivered as plugins
- Cross-platform desktop application (Windows, macOS, Linux)
- 3D event debriefing with GPS, audio, and transcript visualization
- Real-time auto-save with manual confirmation points
- Native installers and automated distribution pipeline

## Dependencies

### External Dependencies

- Rust toolchain 1.89.0+ with cross-compilation targets
- Node.js 22 LTS for frontend development tools
- Python 3.9+ runtime on target systems for plugin support
- Platform-specific build tools (MSVC/Xcode/GCC)

### Internal Dependencies

- Plugin API specification must be defined before plugin development
- Core UI framework needed before plugin UI extensions
- File format schema required before data processing plugins
- 3D engine integration needed before visualization plugins

### Critical Path Items

- Plugin system architecture design (blocking all plugin development)
- Core UI layout framework (blocking all UI plugins)
- File management system (blocking project functionality)
- Three.js integration (blocking 3D visualization features)

## Success Criteria (Technical)

### Performance Benchmarks

- Application startup < 5 seconds on target hardware
- Scene loading < 15 seconds for 500+ entities
- 3D rendering maintains 30+ FPS on integrated graphics
- Plugin loading < 3 seconds per plugin
- Real-time save within 1 second of changes

### Quality Gates

- All first-party functionality implemented via plugin APIs
- Third-party plugin successfully loads and functions without core modification
- Both directory and archive project formats work seamlessly
- Cross-platform feature parity validated on Windows/macOS/Linux
- Memory usage < 2GB for complex scenes

### Acceptance Criteria

- Technical user can create scene from GPS+audio data in < 30 minutes
- Non-technical user can load and explore scene in < 5 minutes
- Plugin installation requires no application restart
- Project files maintain integrity across save/load cycles
- Application gracefully handles corrupted or missing data files

## Estimated Effort

**Overall Timeline**: 8 weeks full-time development

### Resource Requirements

- 1 senior developer with Rust/React/Three.js experience
- Access to cross-platform testing environments
- Basic 3D asset creation tools for sample content

### Critical Path Items

1. **Plugin System Design** (Week 1) - Foundation for everything else
2. **Core UI Framework** (Week 2) - Enables parallel plugin development
3. **File Management** (Week 3) - Required for functional testing
4. **First-Party Plugins** (Weeks 4-6) - Demonstrates architecture viability
5. **Integration Testing** (Weeks 7-8) - Ensures production readiness

### Simplification Opportunities

- Start with JSON-only scene format (avoid complex schema initially)
- Implement directory projects first, add archive support later
- Use existing Three.js examples rather than custom 3D abstractions
- Leverage existing Tauri patterns for file operations
- Begin with minimal plugin API, expand based on first-party plugin needs
