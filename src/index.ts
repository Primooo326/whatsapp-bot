import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { logCapture } from './core/LogCapture';

// Iniciar captura de logs ANTES de cualquier otro módulo
logCapture.startCapture();

import { config } from './config';
import { connectDatabase } from './database/connection';
import { whatsAppClient } from './core/WhatsAppClient';
import messageRoutes from './routes/message.routes';
import { errorHandler } from './middlewares/errorHandler';
import { metricsMiddleware } from './middlewares/metrics.middleware';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Pass socket instance to WhatsAppClient and LogCapture
whatsAppClient.setSocket(io);
logCapture.setSocket(io);

// Middlewares
app.use(cors());
app.use(express.json());
app.use(metricsMiddleware);
app.use('/public', express.static('public'));

// Health check endpoint
app.get('/api/health', (_req, res) => {
    res.status(200).json({
        status: 'oka',
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/api/wha', messageRoutes);

// Error handler (debe ir al final)
app.use(errorHandler);

// Graceful shutdown: liberar Chromium/Puppeteer antes de morir
const gracefulShutdown = async (signal: string) => {
    console.log(`[Server] ${signal} recibido. Cerrando gracefully...`);
    try {
        await whatsAppClient.destroy();
    } catch (e) {
        console.warn('[Server] Error durante shutdown de WhatsApp:', e);
    }
    server.close(() => {
        console.log('[Server] HTTP server cerrado');
        process.exit(0);
    });
    // Forzar salida si no cierra en 10s
    setTimeout(() => {
        console.warn('[Server] Forzando salida después de 10s');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDatabase();

        server.listen(config.port, () => {
            console.log(`[Server] Running on port ${config.port}`);
            console.log(`[Server] Endpoints:`);
            console.log(`  - GET  /api/health`);
            console.log(`  - GET  /api/wha/health`);
            console.log(`  - POST /api/wha/send`);
            console.log(`  - GET  /api/wha/groups`);
            console.log(`  - POST /api/wha/groups/send`);
            console.log(`  - GET  /api/wha/metrics`);
            console.log(`  - GET  /api/wha/metrics/range`);
        });

        // Función para inicializar WhatsApp con reintentos y recuperación de lock huérfano
        const initializeWhatsAppWithRetry = async () => {
            let initialized = false;
            let retryCount = 0;
            
            while (!initialized) {
                try {
                    await whatsAppClient.initialize();
                    initialized = true;
                    console.log('[WhatsApp] Inicializado correctamente.');
                } catch (waError: any) {
                    const msg = waError?.message || String(waError);
                    console.error(`[WhatsApp] Error al inicializar: ${msg}`);
                    
                    const isLockError = msg.includes('browser is already running') || msg.includes('lock');
                    
                    if (isLockError) {
                        retryCount++;
                        console.log(`[WhatsApp] El directorio está bloqueado. Reintento ${retryCount}/6 en 10s...`);
                        
                        // Si llevamos más de 60 segundos (6 reintentos), es probable que el contenedor
                        // anterior haya muerto sin limpiar el SingletonLock. Lo forzamos.
                        if (retryCount >= 6) {
                            console.warn('[WhatsApp] Bloqueo persistente detectado. Intentando limpiar lock huérfano...');
                            try {
                                const fs = await import('fs');
                                const path = await import('path');
                                const sessionDir = path.join(process.cwd(), '.wwebjs_auth', `session-${config.sessionId}`);
                                
                                const lockFiles = ['SingletonLock', 'SingletonCookie', 'SingletonSocket'];
                                let deletedAny = false;

                                for (const file of lockFiles) {
                                    const lockPath = path.join(sessionDir, file);
                                    try {
                                        // No usamos existsSync porque devuelve false en symlinks rotos (que es lo que hace Chromium en Linux)
                                        fs.unlinkSync(lockPath);
                                        deletedAny = true;
                                    } catch (e: any) {
                                        if (e.code !== 'ENOENT') {
                                            console.warn(`[WhatsApp] Error eliminando ${file}:`, e.message);
                                        }
                                    }
                                }

                                if (deletedAny) {
                                    console.log('[WhatsApp] Archivos de bloqueo eliminados con éxito. Reintentando de inmediato.');
                                } else {
                                    console.log('[WhatsApp] No se encontraron archivos de bloqueo, pero falló. Reintentando de todos modos.');
                                }
                            } catch (fsError) {
                                console.error('[WhatsApp] Error general limpiando locks:', fsError);
                            }
                            retryCount = 0; // Reiniciar contador
                        }
                    } else {
                        console.log('[WhatsApp] Reintentando inicialización en 10s...');
                    }
                    
                    // Esperar 10 segundos antes de reintentar
                    await new Promise(resolve => setTimeout(resolve, 10000));
                }
            }
        };

        // Iniciar la inicialización en segundo plano para no bloquear el health check
        initializeWhatsAppWithRetry();

    } catch (error) {
        console.error('[Server] Error starting:', error);
        process.exit(1);
    }
};

startServer();