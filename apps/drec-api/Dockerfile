FROM node:20-alpine

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

# Remove development dependencies
RUN pnpm prune --prod

# Set port number
ENV PORT=3040

# Expose port
EXPOSE 3040

# Command to run the application
CMD ["npm", "run", "start:prod"]