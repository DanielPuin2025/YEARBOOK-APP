FROM node:22-alpine

WORKDIR /app
COPY backend/package.json backend/package-lock.json ./backend/
WORKDIR /app/backend
RUN npm ci --omit=dev

WORKDIR /app
COPY backend ./backend
COPY frontend ./frontend

ENV NODE_ENV=production
ENV PORT=4000
ENV UPLOADS_DIR=/app/backend/uploads

EXPOSE 4000
CMD ["node", "backend/server.js"]
