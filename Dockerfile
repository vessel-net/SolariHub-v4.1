# Multi-stage build for scalable dependency management
# Stage 1: Build environment with all dependencies
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy workspace files for dependency installation
COPY package*.json ./
COPY apps/backend/package.json ./apps/backend/
COPY nx.json ./
COPY tsconfig*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci --include=dev

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Extract runtime dependencies
RUN npm run extract-deps

# Stage 2: Production environment with only runtime dependencies
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001

# Set working directory
WORKDIR /app

# Copy the runtime package.json from builder stage
COPY --from=builder /app/package.runtime.json ./package.json

# Install only production runtime dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy the built application
COPY --from=builder /app/apps/backend/dist/main.js ./main.js

# Copy environment template (optional)
COPY --from=builder /app/apps/backend/.env.example ./.env.example

# Change ownership to app user
RUN chown -R backend:nodejs /app
USER backend

# Expose port
EXPOSE $PORT

# Health check
HEALTH --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "http.get('http://localhost:${PORT:-3000}/api/health/ping', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Start the application with proper signal handling
CMD ["dumb-init", "node", "main.js"] 