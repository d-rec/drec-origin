FROM node:20-alpine AS build

RUN apk --no-cache add bash

WORKDIR /dist/src/app

RUN npm cache clean --force

COPY . .

RUN npm i -g pnpm@9

WORKDIR /dist/src/app/apps/drec-api

RUN npm install --legacy-peer-deps

RUN npm run build

RUN rm -rf ./deployment  
RUN mkdir ./deployment

RUN cp -R package.json ./deployment/
# RUN rush deploy -p @energyweb/origin-drec-api -t ./deployment --overwrite

RUN npm i swagger-ui-express

CMD ["/bin/bash", "-c", "/dist/src/app/apps/drec-api/deployment/apps/drec-api/bin/drec-api"]
