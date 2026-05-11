#!/bin/bash

# Limpiar archivos de bloqueo de Chrome/Puppeteer antes de iniciar
echo "[Entrypoint] Limpiando archivos de bloqueo de Chrome..."

find /app/.wwebjs_auth -name "SingletonLock" -delete 2>/dev/null
find /app/.wwebjs_auth -name "SingletonCookie" -delete 2>/dev/null
find /app/.wwebjs_auth -name "SingletonSocket" -delete 2>/dev/null

echo "[Entrypoint] Iniciando Nginx..."
nginx -g "daemon off;" &

echo "[Entrypoint] Iniciando aplicación Node..."
# Ejecutar la aplicación
exec node dist/index.js
