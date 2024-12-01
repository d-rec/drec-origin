# Build stage
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /usr/src/app

# Install pnpm globally
RUN npm install -g pnpm

# Install Rush globally
RUN npm install -g @microsoft/rush

# Copy package files
COPY package*.json ./

# Install dependencies using Rush (which will use pnpm)
RUN rush install

# Copy source code
COPY . .

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

# Copy built assets from builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules/
COPY --from=builder /usr/src/app/dist ./dist/
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/pnpm-lock.yaml ./
# Set port number
ENV PORT=3040

# Expose port
EXPOSE 3040

# Command to run the application
CMD ["pnpm", "run", "start:prod"]
