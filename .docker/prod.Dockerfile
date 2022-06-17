FROM node:18-alpine as build
RUN apk --no-cache add sqlite
WORKDIR /app
COPY . /app
RUN npm install
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=build /app/dist /app/dist
COPY --from=build /app/package.json /app
RUN npm install --omit=dev

ENTRYPOINT ["npm", "run"]
CMD ["start"]