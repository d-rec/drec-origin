FROM node:20-alpine AS build

RUN apk --no-cache add bash

WORKDIR /app

COPY . .

RUN npm install --legacy-peer-deps

RUN npm run build

CMD ["/bin/bash", "-c", "/app"]
