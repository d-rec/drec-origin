FROM node:16-alpine AS build

RUN apk --no-cache add bash

WORKDIR /dist/src/app
RUN npm cache clean --force
COPY . .

RUN npm i -g @microsoft/rush
RUN npm i -g pnpm@6

WORKDIR /dist/src/app/apps/drec-api

RUN npm install --legacy-peer-deps
RUN npm run build
RUN rm -rf ./deployment
RUN mkdir ./deployment
RUN rush deploy -p @energyweb/origin-drec-api -t ./deployment --overwrite
RUN yarn add swagger-ui-express

# RUN mkdir /var/deployment
# COPY ./ /var/deployment

# WORKDIR /var/deployment/apps/drec-api

CMD ["/bin/bash","-c", "/dist/src/app/apps/drec-api/deployment/apps/drec-api/bin/drec-api"]