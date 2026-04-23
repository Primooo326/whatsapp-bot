FROM node:24-alpine AS builder
WORKDIR /app

COPY . .

RUN npm install && npm run build


FROM node:24-alpine AS runner
WORKDIR /app


COPY install-deps.sh .
RUN chmod +x install-deps.sh && ./install-deps.sh

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

RUN npm install --production


# Comando de ejecución
CMD ["node", "dist/index.js"]