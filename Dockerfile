FROM node:20-alpine
WORKDIR /app

# Lockfile y manifiestos del workspace (mejora el cacheo de capas)
COPY package.json package-lock.json ./
COPY packages/backend/package.json ./packages/backend/

RUN npm ci --omit=dev --workspace=packages/backend

COPY packages/backend ./packages/backend

EXPOSE 3000
CMD ["node", "packages/backend/index.js"]