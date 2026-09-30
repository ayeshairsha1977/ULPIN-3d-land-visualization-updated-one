# One image serves both the web app and the API on the same origin.

FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-slim
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8787 \
    STATIC_DIR=/app/dist \
    STORAGE_DIR=/data/files
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
COPY server ./server
COPY src/data ./src/data
RUN mkdir -p /data/files && chown -R node:node /data
USER node
VOLUME /data/files
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:' + process.env.PORT + '/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
# Apply migrations, seed demo parcels (and demo accounts if SEED_DEMO_PASSWORD is set), then start.
CMD ["sh", "-c", "node server/db/migrate.js && node server/db/seed.js && node server/index.js"]
