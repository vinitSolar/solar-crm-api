# ============================================
# Stage 1: Builder
# Purpose: Install dependencies, compile TypeScript, then prune devDeps
# This entire stage is thrown away after we extract what we need
# ============================================
FROM node:22-slim AS builder
# ↑ Start with official Node.js 22 image (Debian slim variant)
#   "AS builder" gives this stage a name so Stage 2 can reference it

# Install build tools needed for native npm modules (e.g., bcrypt)
# These are only needed during compilation, not at runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
# ↑ Clean up apt cache to keep the layer small

# Set the working directory inside the container
WORKDIR /app
# ↑ All subsequent commands run from /app
#   Similar to doing "cd /app" — Docker creates it if it doesn't exist

# Copy ONLY dependency manifests first (this enables Docker layer caching)
COPY package.json package-lock.json ./
# ↑ WHY just these two files first? Docker caches each step as a "layer".
#   If package.json hasn't changed, Docker reuses the cached npm install
#   from last time — saving 2-3 minutes on every rebuild.

# Prevent Puppeteer from downloading Chromium during npm ci (saves time and avoids unzip dependency)
ENV PUPPETEER_SKIP_DOWNLOAD=true

# Install ALL dependencies (dev + prod — we need devDeps for the build)
RUN npm ci
# ↑ npm ci (clean install) is used instead of npm install because:
#   1. It uses exact versions from package-lock.json (reproducible)
#   2. It's faster in CI/Docker environments
#   3. It fails if lock file is out of sync (catches errors early)

# Now copy the rest of the source code
COPY . .
# ↑ This copies everything NOT excluded by .dockerignore
#   So: apps/, packages/, tsconfig.json, scripts/, etc.
#   NOT copied: node_modules/, dist/, .env, .git/, locations.json

# Compile TypeScript → JavaScript into dist/
RUN npm run build
# ↑ This runs: tsc && tsc-alias && tsx scripts/copy-assets.ts
#   Which: compiles TS → dist/, resolves @packages/* aliases,
#   and copies migrations + email templates into dist/

# Remove devDependencies — only production packages remain in node_modules
RUN npm prune --omit=dev
# ↑ After this, typescript, tsx, tsc-alias, eslint etc. are gone
#   Only express, ioredis, bullmq, pg, bcrypt, etc. remain


# ============================================
# Stage 2: Production
# Purpose: Lean image that only runs the compiled application
# ============================================
FROM node:22-slim
# ↑ Fresh Node.js image — doesn't inherit anything from Stage 1
#   No python3, no make, no g++, no devDependencies

# Install Chromium and fonts needed for Puppeteer PDF quotation generation
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Point Puppeteer to system Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copy package.json (Node.js needs this to recognize "type": "module" for ESM)
COPY --from=builder /app/package.json ./
# ↑ --from=builder means "copy from Stage 1, not from my local machine"

# Copy production-only node_modules from the builder
COPY --from=builder /app/node_modules ./node_modules

# Copy the compiled JavaScript output
COPY --from=builder /app/dist ./dist

# Ensure uploads directory exists for STORAGE_PROVIDER=local
RUN mkdir -p /app/dist/apps/api/public/uploads

# Document which port the app listens on
EXPOSE 5000
# ↑ This doesn't actually publish the port — it's documentation
#   docker-compose.yml handles the actual port mapping

# Start the application
CMD ["node", "dist/apps/api/src/server.js"]
# ↑ This is the command that runs when the container starts
#   Matches your "start" script in package.json
