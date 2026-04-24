# Solución al Error 'Execution context was destroyed' en `whatsapp-web.js` con Docker

Este documento describe los pasos para solucionar un error común con `whatsapp-web.js` cuando se ejecuta dentro de un contenedor de Docker.

## El Error

Al iniciar el contenedor, la aplicación falla con el siguiente error, indicando que Puppeteer no pudo ejecutar una acción porque la página de WhatsApp Web navegó o se recargó inesperadamente.

```bash
/app/node_modules/puppeteer-core/lib/cjs/puppeteer/common/ExecutionContext.js:284
      throw new Error('Execution context was destroyed, most likely because of a navigation.');
            ^

Error: Execution context was destroyed, most likely because of a navigation.
    at rewriteError (/app/node_modules/puppeteer-core/lib/cjs/puppeteer/common/ExecutionContext.js:284:15)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async ExecutionContext._ExecutionContext_evaluate (/app/node_modules/puppeteer-core/lib/cjs/puppeteer/common/ExecutionContext.js:227:56)
    at async ExecutionContext.evaluate (/app/node_modules/puppeteer-core/lib/cjs/puppeteer/common/ExecutionContext.js:107:16)
    at async Client.getWWebVersion (/app/node_modules/whatsapp-web.js/src/Client.js:878:16)
    at async Client.inject (/app/node_modules/whatsapp-web.js/src/Client.js:101:25)
    at async Client.initialize (/app/node_modules/whatsapp-web.js/src/Client.js:346:9)
    at async WhatsAppClientFactory.createClient (/app/dist/WhatsAppClientFactory.js:53:9)

Node.js v18.20.8
```

-----

## Causa Probable

La causa más frecuente es una **sesión de autenticación corrupta o inválida** guardada en el volumen de Docker. Cuando la aplicación intenta reanudar la sesión, WhatsApp Web la rechaza y redirige a la página del código QR, lo que provoca el error.

-----

## Pasos para la Solución

Para resolverlo, es necesario limpiar completamente el estado anterior de la aplicación (contenedor y sesión) y volver a crearla.

### 1\. Detener y Eliminar el Contenedor

Primero, detén y elimina el contenedor existente para asegurar que no queden procesos en ejecución.

```bash
sudo docker stop whatsapp-bot-nodejs-app
sudo docker rm whatsapp-bot-nodejs-app
```

### 2\. Limpiar la Sesión y la Caché

A continuación, elimina las carpetas que almacenan los datos de la sesión. Esto forzará a la aplicación a generar un nuevo código QR para que puedas autenticarte de nuevo.

**Importante:** Ejecuta este comando en el directorio de tu proyecto donde se encuentran los volúmenes de Docker (`.wwebjs_auth/` y `.wwebjs_cache/`).

```bash
sudo rm -rf .wwebjs_auth/ .wwebjs_cache/
```

### 3\. Reconstruir y Levantar el Contenedor

Finalmente, levanta el servicio usando `docker compose`. El flag `--build` asegura que la imagen se reconstruya desde cero, y `-d` lo ejecuta en modo "detached" (en segundo plano).

```bash
sudo docker compose up --build -d
```

Después de este paso, deberás revisar los logs de tu contenedor (con `docker logs -f whatsapp-bot-nodejs-app`) para escanear el nuevo código QR y establecer una sesión limpia.