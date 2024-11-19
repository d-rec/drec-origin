# Build stage
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove development dependencies
RUN npm prune --production

# Production stage
FROM node:20-alpine AS runner

# Create app directory
WORKDIR /usr/src/app

# Copy built assets from builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package*.json ./

# Set port number
ENV PORT=3040

# Expose port
EXPOSE 3040

# Command to run the application
CMD ["npm", "run", "start:prod"]
