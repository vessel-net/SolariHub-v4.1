# 🚀 SolariHub v4.1 Deployment Guide

This guide covers deploying SolariHub to Vercel (frontend) and Render (backend).

## 📁 Deployment Files Created

- ✅ `vercel.json` - Vercel configuration for React/Vite frontend
- ✅ `render.yaml` - Render configuration for Express backend
- ✅ Deployment scripts added to `package.json`

## 🌐 Environment Variables Setup

### 1. Create `.env` file in project root:

```bash
VITE_API_URL=https://solarihub-backend.onrender.com
PORT=4000
NODE_ENV=development
```

### 2. For production deployment:
- **Vercel**: Set `VITE_API_URL` in Vercel dashboard
- **Render**: Environment variables are defined in `render.yaml`

## 🚀 Deployment Steps

### Frontend (Vercel)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy to Vercel:**
   ```bash
   npm run deploy:frontend
   ```

3. **Set Environment Variables in Vercel Dashboard:**
   - Go to your project settings
   - Add `VITE_API_URL` pointing to your Render backend URL

### Backend (Render)

1. **Connect your GitHub repository to Render:**
   - Go to [render.com](https://render.com)
   - Create new Web Service
   - Connect your GitHub repository: `vessel-net/SolariHub-v4.1`

2. **Render will automatically:**
   - Use the `render.yaml` configuration
   - Build with: `npx nx build backend`
   - Start with: `node dist/backend/main.js`
   - Set environment variables as defined

3. **Alternative - Manual deployment info:**
   ```bash
   npm run deploy:backend
   ```

## 🔧 Configuration Details

### Vercel (`vercel.json`)
- Builds the Vite frontend from `apps/frontend/` directory
- Handles SPA routing with rewrites
- Outputs to `dist/frontend`

### Render (`render.yaml`)
- Node.js runtime
- Builds with Nx: `npx nx build backend`
- Production environment variables
- Auto-deploy on git push

## 🌍 Live URLs (after deployment)

- **Frontend**: `https://your-project.vercel.app`
- **Backend**: `https://solarihub-backend.onrender.com`

## 📝 Notes

- Update `VITE_API_URL` to match your actual Render backend URL
- Both services auto-deploy on git push to main branch
- Monitor deployments in respective dashboards
- Check logs in Render/Vercel for troubleshooting 