FROM node:20-bullseye-slim as build

RUN corepack enable
RUN corepack prepare pnpm@latest-9 --activate
RUN pnpm config set store-dir .pnpm-store

WORKDIR /app
COPY . /app
RUN pnpm install --frozen-lockfile
RUN pnpm run build

FROM node:20-bullseye-slim

RUN corepack enable
RUN corepack prepare pnpm@latest-9 --activate
RUN pnpm config set store-dir .pnpm-store

WORKDIR /app
COPY --from=build /app/package.json /app
COPY --from=build /app/pnpm-lock.yaml /app
RUN pnpm install --prod --frozen-lockfile
COPY --from=build /app/scripts/entrypoint.sh /app
COPY --from=build /app/dist /app/dist
COPY --from=build /app/src/views /app/src/views

EXPOSE 3000

CMD ["/bin/sh", "/app/entrypoint.sh"]