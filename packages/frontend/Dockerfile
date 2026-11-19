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
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/packages/frontend/build /usr/share/nginx/html

EXPOSE 80
