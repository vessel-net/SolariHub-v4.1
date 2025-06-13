# 🛠️ Node Runtime Deployment on Render

This file configures SolariHub backend deployment using **Render's native Node.js environment** (not Docker) for simplicity, speed, and compatibility with Nx monorepo.

---

## 📁 Location
Save this file as:
```bash
/devspecs/deploy/render-node-backend.md
```

---

## 📦 Dependencies Required
Ensure the following are already present in your `package.json`:
```json
{
  "scripts": {
    "build": "nx build backend",
    "start": "node dist/apps/backend/main.js"
  },
  "devDependencies": {
    "@nx/node": "21.1.3",
    "nx": "21.1.3"
  }
}
```
If missing, run:
```bash
npm install --save-dev nx@21.1.3 @nx/node@21.1.3
```

---

## 🧭 Cursor Instruction

### Step 1: Remove Docker Setup for Backend
```bash
rm Dockerfile.backend
rm -rf tools/docker/backend
```

### Step 2: Update `.gitignore`
Ensure `dist/`, `.vercel`, and any `.render` folders are ignored:
```bash
echo "\ndist/\n.render/\n.vercel/" >> .gitignore
```

### Step 3: Confirm Nx Build Target Works
```bash
npx nx build backend
```
Expected output:
```
dist/apps/backend/main.js
```

---

## ⚙️ Render Dashboard Settings (Use These Exactly)

### General
- **Name**: `solarihub-v4.1`
- **Region**: Choose closest to primary user base (e.g. Frankfurt for Africa)
- **Runtime**: `Node 20 (LTS)`

### Build & Deploy
- **Repository**: `https://github.com/vessel-net/SolariHub-v4.1`
- **Branch**: `main`
- **Root Directory**: *Leave blank*
- **Build Command**:
```bash
npm run build
```
- **Start Command**:
```bash
npm run start
```
- **Auto Deploy**: ✅ Enabled

### Environment Variables
Add the following (or adapt as needed):
```env
PORT=4000
NODE_ENV=production
CLIENT_URL=https://app.solarihub.net
ALLOWED_ORIGINS=https://app.solarihub.net
```

---

## ✅ Final Cursor Verification Instructions

1. Validate:
```bash
npx nx build backend
npm run start
```
Should run: `Listening on port 4000`

2. Confirm Render Deployment Logs:
- No Docker used
- No `tsconfig.base.json` errors
- Build time < 30s

3. Git Commit Cleanup
```bash
git rm Dockerfile.backend
rm -rf tools/docker/backend
```
```bash
git commit -am "chore: switch backend to Render Node.js runtime and remove Docker"
git push origin main
```

---

## 🧪 QA Checklist
- [x] No Dockerfiles for backend remain
- [x] `nx build backend` succeeds
- [x] `node dist/apps/backend/main.js` runs without error
- [x] Husky pre-commit hooks pass
- [x] Lint, typecheck, test pass
- [x] Render logs show ✅ build success

---

## ✅ SolariMonitor Integration
Check `SolariMonitor CLI` shows:
```
[Backend Deployment] ✅ Node.js runtime (non-Docker)
[Build Output] ✅ dist/apps/backend/main.js
[Render Logs] ✅ CLEAN DEPLOYMENT
```

--- 