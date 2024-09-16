# Stage 1: Build
FROM node:20-bullseye-slim AS build

RUN corepack enable
RUN corepack prepare pnpm@latest-9 --activate
RUN pnpm config set store-dir .pnpm-store

WORKDIR /app
COPY . /app
RUN pnpm install --frozen-lockfile
RUN pnpm run build

# Stage 2: Production
FROM node:20-bullseye-slim

RUN corepack enable
RUN corepack prepare pnpm@latest-9 --activate
RUN pnpm config set store-dir .pnpm-store

WORKDIR /app

# Copy necessary files from the build stage
COPY --from=build /app/package.json /app
COPY --from=build /app/pnpm-lock.yaml /app

# Install production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy application files
COPY --from=build /app/scripts/entrypoint.sh /app
COPY --from=build /app/dist /app/dist
COPY --from=build /app/src/views /app/src/views

# Adjust permissions and switch to non-root user
RUN chown -R node:node /app
USER node

EXPOSE 3000

CMD ["/bin/sh", "/app/entrypoint.sh"]
