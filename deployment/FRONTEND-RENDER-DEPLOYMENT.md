# SolariHub Frontend - Render Docker Deployment Guide

## Overview
This guide walks through deploying the SolariHub frontend as a Docker container to Render, alongside your existing backend service.

## Prerequisites
- ✅ Backend already deployed to Render (solarihub-backend-api)
- ✅ GitHub repository access
- ✅ Render account with billing setup
- ✅ Domain DNS access (for custom domain)

## Step-by-Step Deployment

### 1. Commit Your Changes
```bash
# From your project root
git add .
git commit -m "Add frontend Docker deployment configuration"
git push origin main
```

### 2. Create New Service on Render

1. **Login to Render Dashboard**: https://dashboard.render.com
2. **Click "New +"** → **"Blueprint"**
3. **Connect Repository**: 
   - Select: `vessel-net/SolariHub-v4.1`
   - Branch: `main`
4. **Blueprint File**: `render-frontend.yaml`
5. **Service Name**: `solarihub-frontend`

### 3. Configure Service Settings

#### Basic Settings
- **Name**: `solarihub-frontend`
- **Region**: `Frankfurt (EU Central)` ⚠️ Same as backend
- **Branch**: `main`
- **Runtime**: `Docker`
- **Dockerfile Path**: `./deployment/docker/Dockerfile.frontend`

#### Environment Variables
No additional environment variables needed (configured in nginx).

#### Health Check
- **Health Check Path**: `/`
- **Expected Response**: 200

### 4. Deploy Service

1. **Click "Apply"** to create the service
2. **Monitor Build Logs**:
   - Docker build: ~3-5 minutes
   - Nx frontend build: ~2-3 minutes
   - Nginx setup: ~30 seconds

Expected build time: **5-8 minutes total**

### 5. Verify Deployment

#### Check Service Health
1. **Visit Service URL**: `https://solarihub-frontend-xxxx.onrender.com`
2. **Verify SPA Routing**: Try accessing `/dashboard`, `/profile` etc.
3. **Check API Connectivity**: Ensure frontend can reach backend

#### Test Key Features
- [ ] Homepage loads correctly
- [ ] Navigation works (SPA routing)
- [ ] API calls reach backend at `api.app.solarihub.net`
- [ ] No CORS errors in browser console

### 6. Custom Domain Setup

#### DNS Configuration
Add these DNS records to your domain provider:

```
Type: CNAME
Name: app
Value: solarihub-frontend-xxxx.onrender.com
TTL: 300 (5 minutes)
```

#### Render Domain Setup
1. **Go to Service Settings** → **Custom Domains**
2. **Add Domain**: `app.solarihub.net`
3. **Wait for SSL**: ~10-15 minutes for certificate provisioning

### 7. Final Architecture

```
User Request → app.solarihub.net (Frontend)
                    ↓
              Nginx serves React SPA
                    ↓
              API calls to api.app.solarihub.net (Backend)
                    ↓
              Express API + MongoDB
```

## Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | https://app.solarihub.net | React SPA |
| Backend API | https://api.app.solarihub.net | REST API |
| Render Dashboard | https://dashboard.render.com | Service management |

## Monitoring & Maintenance

### Build Monitoring
- **Auto-deploy**: Enabled on `main` branch pushes
- **Build time**: ~5-8 minutes
- **Health checks**: Every 30 seconds

### Scaling
- **Starter Plan**: $7/month (0.5 CPU, 512MB RAM)
- **Standard Plan**: $25/month (1 CPU, 2GB RAM) - if needed

### Logs & Debugging
```bash
# View service logs
render logs solarihub-frontend --tail

# Check nginx access logs
render logs solarihub-frontend --type nginx
```

## Troubleshooting

### Common Issues

#### 1. Build Fails
```
❌ Error: npm install timeout
✅ Solution: Docker build includes all dependencies
```

#### 2. SPA Routing 404s
```
❌ Error: /dashboard returns 404
✅ Solution: nginx.conf already configured for SPA
```

#### 3. API CORS Errors
```
❌ Error: CORS policy blocks API calls
✅ Solution: Backend already configured for app.solarihub.net
```

#### 4. Slow Build Times
```
❌ Issue: 10+ minute builds
✅ Solution: Docker layer caching optimizes subsequent builds
```

## Cost Estimate

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| Frontend | Starter | $7 |
| Backend | Standard | $25 |
| **Total** | | **$32/month** |

## Success Criteria

✅ **Frontend deployed successfully**  
✅ **Custom domain working** (app.solarihub.net)  
✅ **API integration functional**  
✅ **SPA routing operational**  
✅ **Build time under 10 minutes**  
✅ **Auto-deploy enabled**  

## Next Steps

1. **Monitor Performance**: Check build times and response times
2. **Set Up Monitoring**: Consider adding uptime monitoring
3. **SSL Certificate**: Verify HTTPS works on custom domain
4. **CDN (Optional)**: Consider Cloudflare for additional performance

Your SolariHub frontend will be production-ready with this Docker deployment on Render! 🚀 