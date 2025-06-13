#!/bin/bash
set -e

echo "🚀 ULTRA-SIMPLE Render deployment (no build, pre-built files)..."

# Create minimal runtime package.json
cat > package.json << 'EOF'
{
  "name": "solarihub-backend",
  "version": "1.0.0",
  "scripts": {
    "start": "node apps/backend/dist/main.js"
  },
  "dependencies": {
    "express": "4.21.2"
  }
}
EOF

echo "📦 Installing only express (1 package)..."
npm install --production --no-audit --progress=false

echo "✅ Render deployment ready! Using pre-built backend files." 