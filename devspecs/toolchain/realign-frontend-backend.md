You are working inside a TypeScript-based Nx monorepo called SolariHub. The current app structure is:
apps/web/     (React frontend)
apps/api/     (Express backend)

Refactor the structure to match the proper naming convention and update all affected configs.

1. Rename the folders:
- Rename apps/web to apps/frontend
- Rename apps/api to apps/backend

2. Update Nx and project configuration:
- Replace all references of "web" with "frontend" and "api" with "backend" in nx.json, project.json, and other config files
- Ensure affected files in tools/, apps/, libs/, and root-level files are corrected
- Run "npx nx repair" after changes to update the internal graph

3. Update Docker configuration files:
- Rename Dockerfile.web to Dockerfile.frontend
- Rename Dockerfile.api to Dockerfile.backend
- Update their contents to replace all "web" references with "frontend" and "api" references with "backend"
- In docker-compose.yml:
  - Rename "web" service to "frontend"
  - Rename "api" service to "backend"
  - Update build contexts and volume mounts

4. Update Deployment Configs:
- In vercel.json:
  - Replace all paths and project references from "web" to "frontend"
- In render.yaml:
  - Replace all references from "api" to "backend"
  - Update buildCommand to "npx nx build backend"
  - Update startCommand to "node dist/backend/main.js"

5. Validate the result:
- Run "npx nx graph" to confirm both apps exist
- Run "npx nx build frontend" and "npx nx build backend"
- Confirm that docker-compose up still works with updated service names

Your final folder structure should be:
apps/frontend/
apps/backend/

All tooling, Docker, Nx, and deploy configs should reflect this. Output nothing else. Run this in full and confirm each step internally.
