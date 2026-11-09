FROM node:22-alpine AS builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --include=dev
COPY frontend/ .
COPY backend/src/data/ /app/backend/src/data/
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app/frontend
ENV NODE_ENV=production
COPY frontend/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/frontend/build ./build
EXPOSE 3000
CMD ["npm", "start"]
