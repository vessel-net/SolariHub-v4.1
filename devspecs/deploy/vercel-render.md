# Task: Configure Deployment for SolariHub to Vercel (frontend) and Render (backend)

## ✅ Overview

Set up automated deployment configurations for the SolariHub Nx monorepo:
- Vercel will host the `web` (React/Vite) frontend.
- Render will host the `api` (Express) backend.
- Env vars and Nx output paths must be respected.

---

## 📁 Vercel Frontend Configuration

### 1. Create `vercel.json` at root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "web/vite.config.ts",
      "use": "@vercel/node"
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/web/index.html"
    }
  ]
}
Notes:
	•	Vercel uses the output of npx nx build web
	•	Ensure vite.config.ts outputs to dist/web
	•	Add VITE_API_URL env var pointing to deployed Render backend

Render Backend Configuration
2. Create render.yaml at root:
services:
  - type: web
    name: solarihub-api
    env: node
    buildCommand: npx nx build api
    startCommand: node dist/api/main.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 4000
    autoDeploy: true

 Environment Variables
 3. Update .env at project root:
 VITE_API_URL=https://solarihub-api.onrender.com
PORT=4000
NODE_ENV=development

.env is used by both frontend and backend at dev time.
.env.production will override for builds.
🔄 Update package.json
4. Add deploy scripts
"scripts": {
  "deploy:web": "npx vercel --prod",
  "deploy:api": "echo 'Deploy via Render Dashboard or Git integration'"
}
