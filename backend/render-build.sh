#!/usr/bin/env bash
set -euo pipefail

echo "==> Running from backend directory..."

echo "==> Installing backend dependencies..."
npm install

echo "==> Generating Prisma client..."
npx prisma generate

echo "==> Compiling TypeScript..."
npm run build

echo "==> Build complete!"
