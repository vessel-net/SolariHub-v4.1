# SolariHub Backend Deployment Guide

## 🚀 Deployment Architecture

This backend uses a **multi-stage Docker deployment** with **runtime dependency extraction** to solve the "Cannot find module" errors in containerized environments like Render.

## 🛠️ How It Works

### Problem Solved
- **Issue**: Webpack bundles the code but runtime dependencies (cors, compression, etc.) aren't available in the deployment container
- **Solution**: Extract only the runtime dependencies needed by the bundled `main.js` and install them separately

### Components

1. **`extract-runtime-deps.js`** - Analyzes the webpack bundle and extracts required runtime dependencies
2. **Multi-stage Dockerfile** - Builds the app and creates production image with only runtime deps
3. **`package.runtime.json`** - Generated file containing only dependencies needed by main.js

## 📋 Build Process

### Local Development
```bash
# Build the backend
npm run build

# Extract runtime dependencies  
npm run extract-deps

# Combined build for deployment
npm run build:render
```

### Automatic Deployment (Render)
1. **Stage 1**: Build application with all dependencies
2. **Stage 2**: Extract runtime dependencies from webpack bundle
3. **Stage 3**: Create production image with only runtime dependencies
4. **Deploy**: Runtime dependencies available for main.js execution

## 🔍 Runtime Dependencies Extracted

The script automatically detects and includes:
- `cors` - CORS middleware
- `compression` - Response compression
- `helmet` - Security headers
- `express` - Web framework
- `jsonwebtoken` - JWT handling
- `bcryptjs` - Password hashing
- `mongoose` - MongoDB ODM
- `pg` - PostgreSQL client
- `redis` - Redis client
- `winston` - Logging
- And other dependencies used by the bundled application

## 📊 Benefits

- ✅ **Solves Module Errors**: Runtime dependencies always available
- ✅ **Minimal Image Size**: Only necessary dependencies included
- ✅ **Automatic Detection**: No manual dependency management
- ✅ **Scalable**: Works with any dependency changes
- ✅ **Production Ready**: Multi-stage build optimization

## 🔧 Configuration

### Render Configuration (`render.yaml`)
- **Runtime**: Docker
- **Dockerfile**: `./Dockerfile` (multi-stage)
- **Build Filter**: Includes all necessary source files
- **Health Check**: `/api/health/ping`

### Environment Variables
All environment variables are configured in `render.yaml` and automatically available in the container.

## 🐛 Troubleshooting

### If deployment fails with "Cannot find module X":
1. Verify the module is used in the source code
2. Run `npm run extract-deps` locally to check extraction
3. Check if the module is properly bundled by webpack
4. Ensure the module is in `package.json` dependencies

### To test locally:
```bash
# Build and extract
npm run build:render

# Check generated runtime dependencies
cat package.runtime.json

# Test with Docker
docker build -t solarihub-backend .
docker run -p 3000:3000 solarihub-backend
```

## 📈 Monitoring

- **Health Check**: Automatic health monitoring at `/api/health/ping`
- **Logs**: Available through Render dashboard
- **Metrics**: Node.js performance metrics included

This deployment strategy ensures reliable, scalable backend deployment while maintaining optimal performance and minimal resource usage. 