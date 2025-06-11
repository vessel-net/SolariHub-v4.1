# [task] Scaffold Complete Docker Setup for SolariHub Nx Monorepo

## 🧭 Objective
Scaffold all required Docker configuration files for the Nx-based SolariHub monorepo in one step. Ensure compatibility with `api` (Express), `web` (Vite/React), shared libs, and `types/`.

This includes:
- Dockerfile for `api`
- Dockerfile for `web`
- `docker-compose.yml` to run both
- `.dockerignore` to clean build context

---

## 🛠 Scaffold the following files into the **project root**:

### ✅ 1. Dockerfile.api

```Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY nx.json ./
COPY api ./api
COPY libs ./libs
COPY types ./types

RUN npm install
RUN npm run build api

CMD ["node", "dist/apps/api/main.js"]

2. Dockerfile.web
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY nx.json ./
COPY web ./web
COPY libs ./libs
COPY types ./types

RUN npm install
RUN npm run build web

EXPOSE 3000

CMD ["npx", "vite", "preview", "--host", "--port", "3000"]

 3. docker-compose.yml
 version: "3.8"

services:
  api:
    container_name: solarihub-api
    build:
      context: .
      dockerfile: Dockerfile.api
    ports:
      - "4000:4000"
    environment:
      NODE_ENV: production

  web:
    container_name: solarihub-web
    build:
      context: .
      dockerfile: Dockerfile.web
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production

 4. .dockerignore
 node_modules
dist
.nx
.git
*.log
*.env
coverage
tmp     