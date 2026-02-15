# Multi-stage build for realtime-service
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY services/realtime-service/package*.json services/realtime-service/

# Install dependencies
RUN cd services/realtime-service && npm install --omit=dev

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install curl
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup -g 1001 -S helpinminutes && \
    adduser -S helpinminutes -u 1001

# Copy dependencies from builder
COPY --from=builder /app/services/realtime-service/node_modules ./node_modules

# Copy application code
COPY --chown=helpinminutes:helpinminutes services/realtime-service/ .

# Switch to non-root user
USER helpinminutes

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the application
CMD ["node", "src/server.js"]