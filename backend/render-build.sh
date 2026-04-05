#!/usr/bin/env bash
set -euo pipefail

echo "==> Running from backend directory..."

echo "==> Installing backend dependencies..."
npm install

echo "==> Generating Prisma client..."
npx prisma generate

echo "==> Applying Prisma migrations safely..."
npx prisma migrate deploy

echo "==> Compiling TypeScript..."
npm run build

echo "==> Build complete!"
