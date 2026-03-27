FROM node:20-alpine

# Set environment variables
ARG SENTRY_AUTH_TOKEN
ENV SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN}

# Set the working directory
WORKDIR /usr/src/app

# Install pnpm
RUN npm i -g pnpm@9

# Copy source code
COPY . .

# Enable auto-install-peers
RUN pnpm config set auto-install-peers true

# Install dependencies
RUN pnpm install

# Build the application
RUN pnpm run build

# Send sourcemaps to Sentry
RUN pnpm run sentry:sourcemaps

# Remove development dependencies
RUN pnpm prune --prod

# Create non-root user
RUN addgroup -S app && adduser -S app -G app

# Set port number
ENV PORT=3040

# Expose port
EXPOSE 3040

# Run as non-root
USER app

# Command to run the application
CMD ["npm", "run", "start:prod"]