#!/bin/bash
set -e

echo "🔨 Building locally for deployment..."

# Build backend locally
npm run build

# Create deployment directory
mkdir -p deploy/backend
mkdir -p deploy/frontend

# Copy built backend
cp -r apps/backend/dist/* deploy/backend/
cp apps/backend/package.json deploy/backend/

# Copy built frontend  
cp -r dist/apps/frontend/* deploy/frontend/

# Create ultra-minimal package.json for backend runtime
cat > deploy/backend/package.json << 'EOF'
{
  "name": "solarihub-backend",
  "version": "1.0.0",
  "scripts": {
    "start": "node main.js"
  },
  "dependencies": {
    "express": "4.21.2"
  }
}
EOF

echo "✅ Local build completed!"
echo "📁 Backend ready in: deploy/backend/"
echo "📁 Frontend ready in: deploy/frontend/" 