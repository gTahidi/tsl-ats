# Dockerfile for Next.js app

# 1. Installer stage: Install dependencies
FROM node:20-slim AS deps

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy dependency definition files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --no-frozen-lockfile

# 2. Builder stage: Build the application
FROM node:20-slim AS builder

WORKDIR /app

# Copy dependencies from the deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy the rest of the application files
COPY . .

# Pass build-time environment variables
ARG POSTGRES_URL_NON_POOLING
ARG AZURE_STORAGE_CONNECTION_STRING
ARG AZURE_STORAGE_CONTAINER_NAME
ENV POSTGRES_URL_NON_POOLING=$POSTGRES_URL_NON_POOLING
ENV AZURE_STORAGE_CONNECTION_STRING=$AZURE_STORAGE_CONNECTION_STRING
ENV AZURE_STORAGE_CONTAINER_NAME=$AZURE_STORAGE_CONTAINER_NAME

# Build the Next.js application
RUN npm run build

# Create an empty public directory if it doesn't exist to prevent copy errors
RUN mkdir -p /app/public

# 3. Runner stage: Run the application
FROM node:20-slim AS runner

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production

# Copy the built application from the builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
