# Грађевина не зна за инстанцу: ни префикс ни адреса backend-а не улазе у bundle.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /frontend-src
COPY deploy/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY deploy/nginx/proxy-common.conf /etc/nginx/templates/proxy-common.conf
COPY deploy/nginx/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && rm -f /etc/nginx/conf.d/default.conf
ENTRYPOINT ["/entrypoint.sh"]
