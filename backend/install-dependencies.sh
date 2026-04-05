#!/bin/bash

# Install dependencies for database improvements
echo "📦 Installing dependencies for database improvements..."

# Install DataLoader for N+1 query optimization
npm install dataloader

# Install node-cron for backup scheduling
npm install node-cron

# Install types for node-cron
npm install -D @types/node-cron

echo "✅ Dependencies installed successfully!"
echo ""
echo "Installed packages:"
echo "  - dataloader: Batch loading for N+1 query optimization"
echo "  - node-cron: Backup scheduling"
echo "  - @types/node-cron: TypeScript types for node-cron"