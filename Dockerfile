# Multi-stage build for Node.js application

# Stage 1: Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Stage 2: Production stage
FROM node:18-alpine

WORKDIR /app

# Copy dependencies from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY server.js ./
COPY package.json ./

# Expose port
EXPOSE 3000

# Run as non-root user for security
USER node

# Start the application
CMD ["node", "server.js"]
