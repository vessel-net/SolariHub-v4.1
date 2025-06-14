# Multi-stage Dockerfile for SolariHub Backend
# DEFINITIVE FIX for "Cannot find module 'cors'" deployment issue

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
COPY scripts/ ./scripts/

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Build the backend application
RUN npx nx build backend --prod

# Extract runtime dependencies from the workspace root with correct paths
RUN node scripts/extract-runtime-deps.js

# Debug: Verify the runtime package.json was created
RUN ls -la package.runtime.json && cat package.runtime.json

# Stage 2: Production runtime
FROM node:20-alpine as production

# Install curl for health check
RUN apk --no-cache add curl

WORKDIR /app

# Copy the built application from builder stage
COPY --from=builder /app/apps/backend/dist/ ./

# Copy the extracted runtime package.json from the correct location
COPY --from=builder /app/package.runtime.json ./package.json

# Debug: Verify package.json was copied correctly
RUN echo "=== Verifying package.json ===" && cat package.json

# Install ONLY the runtime dependencies needed by main.js
# Use --verbose for debugging and remove --silent
RUN npm install --production --verbose

# Debug: Verify dependencies were installed
RUN echo "=== Verifying node_modules ===" && ls -la node_modules/ | head -20
RUN echo "=== Checking for cors module specifically ===" && ls -la node_modules/cors/ || echo "CORS NOT FOUND"

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001

# Change ownership of the app directory AFTER installing dependencies
RUN chown -R backend:nodejs /app

# Switch to non-root user
USER backend

# Debug: Verify permissions and modules as backend user
RUN echo "=== Final verification as backend user ===" && \
    whoami && \
    pwd && \
    ls -la && \
    ls -la node_modules/cors/ || echo "CORS NOT ACCESSIBLE TO BACKEND USER"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:10000/api/health/ping || exit 1

# Expose port
EXPOSE 10000

# Start the application with additional debugging
CMD ["sh", "-c", "echo 'Starting application...' && echo 'Node modules:' && ls -la node_modules/cors || echo 'CORS not found' && node main.js"] 