FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/
RUN npm ci --workspace=frontend --include-workspace-root=false

COPY packages/frontend ./packages/frontend

ARG REACT_APP_API_URL=/api
ARG REACT_APP_LOGTO_ENDPOINT
ARG REACT_APP_LOGTO_APP_ID
ARG REACT_APP_LOGTO_RESOURCES
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_LOGTO_ENDPOINT=$REACT_APP_LOGTO_ENDPOINT
ENV REACT_APP_LOGTO_APP_ID=$REACT_APP_LOGTO_APP_ID
ENV REACT_APP_LOGTO_RESOURCES=$REACT_APP_LOGTO_RESOURCES

RUN npm run build --workspace=frontend

FROM nginx:1.27-alpine
COPY packages/frontend/nginx.conf packages/frontend/nginx-tls.conf /opt/nginx/
COPY packages/frontend/nginx-app.conf /etc/nginx/nginx-app.conf
COPY packages/frontend/nginx-iniciar.sh /docker-entrypoint.d/40-configurar-tls.sh
COPY packages/frontend/nginx-certificados.sh /opt/nginx/certificados.sh
COPY --from=build /app/packages/frontend/build /usr/share/nginx/html
RUN chmod +x /docker-entrypoint.d/40-configurar-tls.sh

EXPOSE 80 443 8080
