FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
COPY test ./test
RUN npm run build

FROM node:24-alpine
RUN apk add --no-cache ffmpeg
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist/src ./dist/src
COPY public ./public
USER node
EXPOSE 8080
CMD ["node", "dist/src/server.js"]
