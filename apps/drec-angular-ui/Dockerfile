FROM nginx:alpine

RUN apk add --no-cache bash

COPY dist/origin-drec-angular-ui /usr/share/nginx/html/
COPY nginx/default.conf.template /etc/nginx/conf.d/default.conf.template

WORKDIR /usr/share/nginx/html

CMD ["/bin/bash", "-c", "DOLLAR='$' envsubst < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g \"daemon off;\""]
