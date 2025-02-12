# Etapa de construcción
FROM node:18-slim AS builder

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
FROM node:18-slim

WORKDIR /app

# Instalar dependencias del sistema necesarias para Puppeteer
RUN apt-get update && apt-get install -y \
    gconf-service \
    libgbm-dev \
    libasound2 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    fonts-liberation \
    libappindicator1 \
    libnss3 \
    lsb-release \
    xdg-utils \
    wget \
    tzdata \
    && rm -rf /var/lib/apt/lists/* \
    # Crear directorios necesarios
    && mkdir -p /app/logs /app/.wwebjs_auth /app/.wwebjs_cache \
    # Establecer permisos
    && chown -R node:node /app

# Configurar variables de entorno para Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false

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