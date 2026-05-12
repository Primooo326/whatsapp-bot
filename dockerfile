FROM node:24-slim AS builder
WORKDIR /app

# Build backend
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Build frontend
WORKDIR /app/frontend/front-wha-bot
RUN npm install
RUN npm run build

FROM node:24-slim AS runner
WORKDIR /app

# Copiar y ejecutar script de dependencias de Chromium
COPY install-deps.sh ./
RUN chmod +x install-deps.sh && ./install-deps.sh && rm install-deps.sh

# Copiar builds (backend y frontend)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/frontend/front-wha-bot/dist ./frontend-dist
COPY --from=builder /app/package*.json ./

RUN npm install --production

# Copiar configuración de Nginx
COPY nginx.conf /etc/nginx/sites-available/default

# Comando de ejecución usando el entrypoint
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh
CMD ["./docker-entrypoint.sh"]

EXPOSE 80