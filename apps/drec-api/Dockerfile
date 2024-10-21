FROM node:20-alpine AS build

RUN apk --no-cache add bash

WORKDIR /dist/src/app

RUN npm cache clean --force

COPY . .

WORKDIR /dist/src/app/apps/drec-api

RUN npm install --legacy-peer-deps

RUN npm run build

RUN npm i swagger-ui-express

CMD ["/bin/bash", "-c", "/dist/src/app/apps/drec-api"]
