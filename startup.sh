#!/bin/bash
# Azure App Service startup script
set -e

echo "=== NEXUS Azure Startup ==="
echo "Node version: $(node --version)"
echo "npm version: $(npm --version)"
echo "PORT: $PORT"
echo "Working directory: $(pwd)"

# Install production dependencies if node_modules is missing
# This ensures better-sqlite3 is compiled for Azure's Linux
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies on Azure..."
  npm install --production
fi

# Rebuild native modules (better-sqlite3) for this platform
echo "Rebuilding native modules..."
npm rebuild better-sqlite3 2>/dev/null || echo "Rebuild skipped (already built)"

# Ensure data directory exists
mkdir -p /home/site/data

# Initialize database if it doesn't exist
if [ ! -f "/home/site/data/nexus.db" ]; then
  echo "First run detected — initializing database..."
  node prisma/azure-init.js
  echo "Database initialized successfully."
else
  echo "Database already exists at /home/site/data/nexus.db"
fi

# Verify .next build output exists
if [ ! -d ".next" ]; then
  echo "ERROR: .next directory not found. Running build..."
  npm run build
fi

# Start the Next.js server
echo "Starting NEXUS server on port ${PORT:-8080}..."
node node_modules/next/dist/bin/next start -p ${PORT:-8080}
