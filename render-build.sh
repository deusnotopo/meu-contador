#!/usr/bin/env bash
set -euo pipefail

echo "==> Navigating to backend directory..."
cd backend

echo "==> Installing backend dependencies..."
npm install

echo "==> Generating Prisma client..."
npx prisma generate

echo "==> Compiling TypeScript..."
npm run build

echo "==> Build complete!"
