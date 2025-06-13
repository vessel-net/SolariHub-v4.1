#!/bin/bash
set -e

echo "🚀 Starting optimized Vercel frontend deployment..."

# Go to project root
cd ../..

# Backup original package.json
cp package.json package.dev.json

# Create minimal package.json for frontend build
cat > package.json << 'EOF'
{
  "name": "solarihub-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "npx nx build frontend"
  },
  "dependencies": {
    "nx": "21.1.3",
    "@nx/vite": "21.1.3",
    "@nx/react": "21.1.3",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "typescript": "5.7.2",
    "vite": "6.0.0",
    "@vitejs/plugin-react": "4.2.0",
    "tailwindcss": "3.4.3",
    "autoprefixer": "10.4.13",
    "postcss": "8.4.38"
  }
}
EOF

# Generate package-lock.json and install minimal dependencies
npm install --prefer-offline --no-audit --progress=false

# Build the frontend
npx nx build frontend

echo "✅ Vercel frontend build completed!" 