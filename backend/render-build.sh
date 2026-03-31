#!/usr/bin/env bash
set -euo pipefail

echo "==> Running from backend directory..."

echo "==> Installing backend dependencies..."
npm install

echo "==> Generating Prisma client..."
npx prisma generate

echo "==> Syncing database schema (accepting data loss for removed columns)..."
npx prisma db push --accept-data-loss

echo "==> Compiling TypeScript..."
npm run build

echo "==> Build complete!"
