FROM node:18-bullseye-slim

RUN corepack enable
RUN corepack prepare pnpm@latest-8 --activate
RUN pnpm config set store-dir .pnpm-store

ARG MODD_VERSION=0.8
RUN apt update && apt install -y wget
RUN wget -P /tmp "https://github.com/cortesi/modd/releases/download/v$MODD_VERSION/modd-$MODD_VERSION-linux64.tgz"
RUN tar -zxvf "/tmp/modd-$MODD_VERSION-linux64.tgz" -C /tmp
RUN cp "/tmp/modd-$MODD_VERSION-linux64/modd" /usr/local/bin
RUN rm -rf "/tmp/modd-$MODD_VERSION-linux64" && rm "/tmp/modd-$MODD_VERSION-linux64.tgz"

RUN apt-get update && apt-get install -y git sqlite3 jq

WORKDIR /app