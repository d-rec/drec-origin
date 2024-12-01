# Build stage
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /usr/src/app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files
COPY package*.json ./ 

# Install dependencies with pnpm
RUN pnpm install

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Remove development dependencies
RUN pnpm prune --prod

# Production stage
FROM node:20-alpine AS runner

# Create app directory
WORKDIR /usr/src/app

# Install pnpm globally in the production image
RUN npm install -g pnpm

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
