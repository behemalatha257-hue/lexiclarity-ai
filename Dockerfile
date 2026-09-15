# Multi-stage Lightweight Production Dockerfile for LexiClarity AI
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Production image
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# Security: Run as non-root user
USER node

# Copy dependencies and application source
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node package*.json ./
COPY --chown=node:node server.js ./
COPY --chown=node:node server/ ./server/
COPY --chown=node:node public/ ./public/

EXPOSE 8080

CMD ["node", "server.js"]
