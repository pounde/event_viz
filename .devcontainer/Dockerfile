FROM mcr.microsoft.com/devcontainers/rust:1-1-bullseye

# Install Node.js 18
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# Install system dependencies for Tauri
RUN apt-get update && apt-get install -y \
    libwebkit2gtk-4.0-dev \
    build-essential \
    curl \
    wget \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    patchelf \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Install Tauri CLI as vscode user
USER vscode
RUN cargo install tauri-cli --version "^2.0.0"

# Install additional Rust components
RUN rustup component add clippy rustfmt && \
    rustup target add x86_64-unknown-linux-gnu

# Verify installations
RUN echo "Rust: $(rustc --version)" && \
    echo "Cargo: $(cargo --version)" && \
    echo "Node.js: $(node --version)" && \
    echo "npm: $(npm --version)"

USER root