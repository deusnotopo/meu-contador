#!/usr/bin/env bash
set -euo pipefail

echo "==> Running from backend directory..."

echo "==> Installing backend dependencies..."
npm install

echo "==> Generating Prisma client..."
npx prisma generate

echo "==> Syncing Prisma schema to database..."
npx prisma db push --accept-data-loss

echo "==> Compiling TypeScript..."
npm run build

echo "==> Creating entry point wrapper..."
echo "require('./backend/src/server');" > dist/server.js

echo "==> Build complete!"
