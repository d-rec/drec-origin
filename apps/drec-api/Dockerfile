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

# Install dependencies, build, upload sourcemaps, and prune
RUN pnpm config set auto-install-peers true && \
    pnpm install && \
    pnpm run build && \
    pnpm run sentry:sourcemaps && \
    pnpm prune --prod

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