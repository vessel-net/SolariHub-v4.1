#!/bin/bash
set -e

echo "🚀 Starting ULTRA-FAST Render deployment..."

# Create minimal package.json with only runtime dependency
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

# Install only express (1 package)
npm install --production --no-audit --progress=false

# Copy pre-built files (these should already exist from local build)
if [ ! -f "apps/backend/dist/main.js" ]; then
    echo "❌ Backend not built! Run 'npm run build' locally first"
    exit 1
fi

echo "✅ Render deployment completed - using pre-built backend!" 