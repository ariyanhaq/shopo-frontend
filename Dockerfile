# Production Dockerfile for Shopo Frontend (Vite + React) on Coolify / VPS

# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build arguments for Vite environment variables
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_API_URL
ARG VITE_IMGBB_API_KEY

# Assign build arguments to environment variables so Vite embeds them
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY \
    VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN \
    VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID \
    VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET \
    VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID \
    VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID \
    VITE_API_URL=$VITE_API_URL \
    VITE_IMGBB_API_KEY=$VITE_IMGBB_API_KEY

# Install dependencies (utilize Docker caching)
COPY package*.json ./
RUN npm ci || npm install

# Copy application source code
COPY . .

# Build the production bundle
RUN npm run build

# Stage 2: Production Nginx Runner
FROM nginx:alpine AS runner

# Remove default nginx html files
RUN rm -rf /usr/share/nginx/html/*

# Copy build artifacts from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose web ports (80, 3000, 5173, 8080) for Coolify Traefik port matching
EXPOSE 80 3000 5173 8080

# Health check probe for Coolify / Docker
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/healthz || exit 1

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]
