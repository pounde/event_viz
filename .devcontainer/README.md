# Tauri Development Environment

This dev container provides a complete, isolated development environment for building Tauri applications with React and TypeScript.

## What's Included

- **Rust toolchain** with latest stable version
- **Node.js 18** with npm
- **Tauri CLI 2.0+** for project management
- **System dependencies** for Linux Tauri development
- **VS Code extensions** optimized for Tauri development
- **Port forwarding** for dev servers (1420 for Tauri, 3000 for React)

## Quick Start

1. Open this repository in VS Code
2. When prompted, click "Reopen in Container"
3. Wait for the container to build and start
4. Run `cargo tauri init` to initialize your Tauri project

## Available Extensions

- **rust-analyzer** - Rust language server
- **Tauri VS Code Extension** - Tauri-specific tooling
- **Prettier** - Code formatting
- **TypeScript** - Enhanced TypeScript support
- **Tailwind CSS** - CSS utility classes support

## Port Configuration

- **1420** - Tauri development server
- **3000** - React development server (Vite)

Both ports are automatically forwarded and will show notifications when services start.

## Development Commands

Once the container is ready, you can use standard Tauri commands:

```bash
# Initialize Tauri project (if not done)
cargo tauri init

# Start development server
cargo tauri dev

# Build for production
cargo tauri build

# Run tests
cargo test
npm test
```