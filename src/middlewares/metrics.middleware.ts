import { Request, Response, NextFunction } from 'express';
import { metricsService } from '../services/metrics.service';

/**
 * Middleware para registrar métricas de cada petición a la API
 */
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    // Capturamos el fin de la respuesta
    res.on('finish', async () => {
        const responseTimeMs = Date.now() - startTime;
        const endpoint = req.path;
        const method = req.method;
        const statusCode = res.statusCode;

        // Registrar la petición
        await metricsService.trackApiRequest(endpoint, method, statusCode, responseTimeMs);

        // Si hubo error, registrarlo también
        if (statusCode >= 400) {
            await metricsService.trackApiError(endpoint, method, res.statusMessage || 'Error', statusCode);
        }
    });

    next();
};
