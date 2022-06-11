FROM node:18-alpine

RUN apk --no-cache add git sqlite

WORKDIR /app