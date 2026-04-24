#!/bin/bash

# Limpiar archivos de bloqueo de Chrome/Puppeteer antes de iniciar
echo "[Entrypoint] Limpiando archivos de bloqueo de Chrome..."

find /app/.wwebjs_auth -name "SingletonLock" -delete 2>/dev/null
find /app/.wwebjs_auth -name "SingletonCookie" -delete 2>/dev/null
find /app/.wwebjs_auth -name "SingletonSocket" -delete 2>/dev/null

echo "[Entrypoint] Iniciando aplicación..."

# Ejecutar la aplicación
exec node dist/index.js
