# 🔒 Deployment Lock - Working Configuration

## ✅ Stable Frontend Deployment
- **Commit**: `bbfde5a` - "Add missing frontend dependencies: jiti, postcss, tailwindcss for TypeScript config processing"  
- **Tag**: `frontend-v1.0-stable`
- **Date**: June 12, 2025
- **Status**: ✅ WORKING - Deploys in ~37 seconds

## 📋 Working Configuration

### Vercel Configuration (`apps/frontend/vercel.json`):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Frontend Dependencies (`apps/frontend/package.json`):
```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@nx/vite": "^21.1.3",
    "@nx/react": "^21.1.3", 
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^6.0.0",
    "typescript": "~5.7.2",
    "jiti": "^2.4.2",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.3",
    "autoprefixer": "^10.4.13"
  }
}
```

### Key Success Factors:
- ❌ **No `nx.json` in root** (prevents Nx auto-detection)
- ❌ **No `vercel.json` in root** (uses frontend-specific config)
- ✅ **Clean frontend build process** with Vite
- ✅ **Minimal dependency set** for fast installs

## 🚨 DO NOT MODIFY These Files Without Testing:
- `apps/frontend/vercel.json`
- `apps/frontend/package.json`
- Root level files that might trigger auto-detection

## 🔄 Emergency Rollback Command:
```bash
git checkout frontend-v1.0-stable
git push --force-with-lease
``` 