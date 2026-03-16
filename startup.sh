#!/bin/bash
# Azure App Service startup script

echo "=== NEXUS Azure Startup ==="

# Initialize database if it doesn't exist
if [ ! -f "/home/site/data/nexus.db" ]; then
  echo "First run detected — initializing database..."
  mkdir -p /home/site/data
  node prisma/azure-init.js
fi

# Start the Next.js server
echo "Starting NEXUS server on port $PORT..."
npx next start -p $PORT
