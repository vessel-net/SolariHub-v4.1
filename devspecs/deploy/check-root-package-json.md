# [task] Audit Root package.json in Nx Monorepo (SolariHub)

## 🎯 Objective
Audit the root `package.json` of the SolariHub Nx monorepo to verify:

- Proper workspace configuration
- Correct Nx CLI setup
- Presence of essential build and lint scripts
- Dependency health and alignment with Nx best practices

## 📁 Context
This prompt is to be run from the root of the monorepo (where `package.json`, `nx.json`, and `tsconfig.base.json` exist).

## ✅ Tasks

1. Read and parse the root `package.json`.
2. Verify and log:
   - `name`, `version`, `private` flags
   - `workspaces` definition (should include `apps/*` and `libs/*`)
   - Existence of key scripts:
     - `build`
     - `format`
     - `lint`
     - `test`
     - `nx`
   - Presence of Nx CLI dependency (`nx` or `@nrwl/cli`) and version
   - Check for consistency of `typescript`, `eslint`, and `prettier` versions (devDependencies)
3. Output a structured Markdown report showing:
   - ✅ Valid entries
   - ❌ Missing or invalid entries
   - 🟡 Optional improvements

## 📦 Expected Output Example

```md
## 📦 Root package.json Audit (SolariHub v4.1)

### General Info
- Name: `solarihub-v4.1` ✅
- Private: `true` ✅

### Workspaces
- `apps/*` ✅
- `libs/*` ✅

### Scripts
- `build`: ❌ Missing
- `nx`: ✅ Present
- `lint`: ✅
- `test`: ✅
- `format`: ✅

### Dependencies
- `nx`: ^21.1.3 ✅
- `typescript`: ^5.4.5 ✅
- `eslint`: ^8.x ✅
- `prettier`: ^3.x ✅

---

### 🧩 Recommendations
- Add missing `"build"` script (e.g., `"build": "nx build"`).
- Consider validating all project-level package.json files with similar audit logic.