# Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy rush.json from the root folder
COPY rush.json ./

# Copy package files
COPY package*.json ./

# Install pnpm and Rush globally
RUN npm install -g pnpm @microsoft/rush

# Install dependencies using Rush
RUN rush install

# Copy the entire source code
COPY . .

# Build the application
RUN rush build

# Prune development dependencies
RUN rush prune --prod
