# Build stage
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /usr/src/app

# Copy rush.json and package files
COPY rush.json ./
COPY package*.json ./

# Install pnpm and Rush globally
RUN npm install -g pnpm @microsoft/rush

# Install dependencies using Rush (which will use pnpm)
RUN rush install --legacy-peer-deps

# Copy source code
COPY . .

# Upgrade typescript to meet ts-jest requirements
RUN pnpm add typescript@^4.3.0

# Build the application using Rush (which uses pnpm)
RUN rush build

# Remove development dependencies
RUN rush prune --prod

# Production stage
FROM node:20-alpine AS runner

# Create app directory
WORKDIR /usr/src/app

# Install pnpm and Rush globally in the production image
RUN npm install -g pnpm @microsoft/rush

# Copy only the necessary built assets from the builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/pnpm-lock.yaml ./

# Set port number
ENV PORT=3040

# Expose port
EXPOSE 3040

# Command to run the application
CMD ["pnpm", "run", "start:prod"]
