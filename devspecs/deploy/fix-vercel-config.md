# Title: Fix and Validate Nx + Vercel Deployment Configuration for apps/frontend

## Goal
Audit and automatically fix all configurations required for a successful Vercel deployment of the SolariHub frontend app located at `apps/frontend`.

This prompt will:
- Ensure Nx workspace is correctly configured
- Add required dependencies and scripts
- Fix `vercel.json` and build targets
- Validate that `npx nx build frontend` works

---

## Tasks

### 1. 🧩 Verify and Install Core Nx Dependencies in Root `package.json`
Ensure the following are present:
- `"nx"` (latest)
- `"@nx/devkit"`
- `"typescript"` (v5.x preferred)

If missing, install them with:

```bash
npm install -D nx @nx/devkit typescript
```

---

### 2. 🗂️ Ensure Root `package.json` Includes Workspaces
Ensure this exists in the root `package.json`:

```json
"workspaces": [
  "apps/*",
  "libs/*"
]
```

---

### 3. 🛠️ Add Required Scripts to Root `package.json`

Ensure:

```json
"scripts": {
  "build": "nx build",
  "start": "nx serve",
  "test": "nx test",
  "e2e": "nx e2e",
  "nx": "nx"
}
```

---

### 4. 🧠 Fix or Create `nx.json` in Root

Ensure the following structure:

```json
{
  "npmScope": "solarihub",
  "affected": {
    "defaultBase": "main"
  },
  "projects": {
    "frontend": "apps/frontend",
    "backend": "apps/backend"
  }
}
```

---

### 5. 📦 Validate `apps/frontend/project.json`

Ensure:

```json
{
  "targets": {
    "build": {
      "executor": "@nx/vite:build",
      "options": {
        "outputPath": "dist/apps/frontend"
      }
    }
  }
}
```

---

### 6. ⚙️ Create or Fix `vercel.json` in Project Root

Content:

```json
{
  "buildCommand": "npx nx build frontend",
  "outputDirectory": "dist/apps/frontend",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

### 7. 📁 Create `.vercelignore` (Optional)

Add:

```
node_modules
dist
.vscode
*.log
```

---

### 8. 📥 Run `npm install` in the root directory

Ensure dependencies are available during Vercel CI build.

---

### 9. ✅ Validate Build Locally

Run:

```bash
npx nx build frontend
```

---

## Output Summary

- ✅ `nx.json` verified or fixed
- ✅ `package.json` includes scripts + workspaces
- ✅ `project.json` correctly targets `frontend`
- ✅ `vercel.json` in place and correct
- ✅ Build command: `npx nx build frontend` passes

---

## Important Notes

- Never use `npm run build --workspace=frontend` in Vercel.
- Use `npx nx build frontend` as defined in this prompt.
