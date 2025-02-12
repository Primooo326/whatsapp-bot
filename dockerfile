# Etapa de construcción
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar solo los archivos necesarios para instalar dependencias
COPY package*.json ./

# Instalar dependencias incluyendo devDependencies
RUN npm ci && \
    npm cache clean --force

# Copiar código fuente
COPY . .

# Construir la aplicación TypeScript
RUN npm run build

# Etapa de producción
FROM node:18-alpine

WORKDIR /app

# Instalar solo las dependencias necesarias para Puppeteer en Alpine
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    tzdata && \
    # Crear directorios necesarios
    mkdir -p /app/logs /app/.wwebjs_auth /app/.wwebjs_cache && \
    # Establecer permisos
    chown -R node:node /app

# Configurar variables de entorno para Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Cambiar al usuario node por seguridad
USER node

# Copiar package.json y package-lock.json
COPY --from=builder --chown=node:node /app/package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --only=production && \
    npm cache clean --force

# Copiar el código compilado
COPY --from=builder --chown=node:node /app/dist ./dist

# Exponer el puerto
EXPOSE 3000

# Comando para ejecutar la aplicación
CMD ["node", "dist/index.js"]