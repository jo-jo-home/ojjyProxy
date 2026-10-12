FROM node:24-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY relay ./relay
ENV NODE_ENV=production PORT=9000 HOST=0.0.0.0
EXPOSE 9000
USER node
CMD ["node", "relay/server.mjs"]
