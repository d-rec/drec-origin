# Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install Rush globally
RUN npm install -g @microsoft/rush

# Copy rush.json from the root folder
COPY rush.json ./ 

# Copy the entire source code into the container
COPY . ./ 

# Set an alternative recycler folder to avoid cross-device link issues
ENV RUSH_TEMP_FOLDER=/usr/src/app/common/temp/rush-temp

# Unset RUSH_RECYCLER to avoid conflicts
RUN unset RUSH_RECYCLER

# Run Rush install with purge
RUN rush install --purge

# Build the application
RUN rush build

# Production stage
FROM node:20-alpine AS runtime

WORKDIR /usr/src/app

# Copy built assets from builder stage
COPY --from=builder /usr/src/app/apps/drec-api/dist /usr/src/app/dist/

# Copy package*.json files from the root folder
COPY --from=builder /usr/src/app/apps/drec-api/package*.json /usr/src/app/

# Copy pnpm-lock.yaml from apps/drec-api
COPY --from=builder /usr/src/app/apps/drec-api/pnpm-lock.yaml /usr/src/app/

# Set port number and expose it
ENV PORT=3040
EXPOSE 3040

# Command to run the application
CMD ["pnpm", "run", "start:prod"]
