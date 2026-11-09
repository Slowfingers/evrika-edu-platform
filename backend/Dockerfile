FROM node:22-alpine
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/src/ ./src/
EXPOSE 10000
CMD ["npm", "start"]
