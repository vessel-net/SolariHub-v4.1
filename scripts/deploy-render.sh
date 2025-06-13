#!/bin/bash
set -e

echo "🚀 Starting optimized Render deployment..."

# Backup original package.json
cp package.json package.dev.json

# Use production package.json with minimal dependencies
cp package.production.json package.json

# Generate package-lock.json and install minimal dependencies
npm install --prefer-offline --no-audit --progress=false

# Build the backend
npx nx build backend

echo "✅ Render deployment build completed!" 