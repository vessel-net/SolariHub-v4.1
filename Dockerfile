# Multi-stage Dockerfile for SolariHub Backend
# Solves "Cannot find module" errors by using extracted runtime dependencies

# Stage 1: Build the application
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY nx.json ./
COPY tsconfig*.json ./

# Copy source code
COPY apps/ ./apps/
COPY libs/ ./libs/
COPY tools/ ./tools/

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Build the backend application
RUN npx nx build backend --prod

# Extract runtime dependencies
WORKDIR /app/apps/backend
RUN node extract-runtime-deps.js

# Stage 2: Production runtime
FROM node:20-alpine as production

WORKDIR /app

# Copy the built application from builder stage
COPY --from=builder /app/apps/backend/dist/ ./

# Copy the extracted runtime package.json
COPY --from=builder /app/apps/backend/package.runtime.json ./package.json

# Install ONLY the runtime dependencies needed by main.js
RUN npm install --production --silent

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001

# Change ownership of the app directory
RUN chown -R backend:nodejs /app
USER backend

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "main.js"] 