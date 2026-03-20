#!/bin/bash
# Azure App Service startup script

echo "=== NEXUS Azure Startup ==="
echo "Node version: $(node --version)"
echo "PORT: $PORT"
echo "Working directory: $(pwd)"

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

# Find next binary - check multiple locations
NEXT_BIN=""
if [ -f "./node_modules/next/dist/bin/next" ]; then
  NEXT_BIN="./node_modules/next/dist/bin/next"
elif [ -f "/node_modules/next/dist/bin/next" ]; then
  NEXT_BIN="/node_modules/next/dist/bin/next"
fi

if [ -z "$NEXT_BIN" ]; then
  echo "ERROR: next binary not found. Installing dependencies..."
  npm install --omit=dev
  NEXT_BIN="./node_modules/next/dist/bin/next"
fi

echo "Using next at: $NEXT_BIN"

# Start the Next.js server
echo "Starting NEXUS server on port ${PORT:-8080}..."
node $NEXT_BIN start -p ${PORT:-8080}
