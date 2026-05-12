import { Request, Response, NextFunction } from 'express';
import { whatsAppClient } from '../core/WhatsAppClient';
import { logCapture } from '../core/LogCapture';

class SessionController {
    public async restart(
        _req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            res.status(200).json({
                success: true,
                message: 'Reinicio del cliente iniciado'
            });
            // Ejecutar en background para no bloquear la respuesta
            whatsAppClient.restart().catch(err => {
                console.error('[Session] Error reiniciando cliente:', err);
            });
        } catch (error) {
            next(error);
        }
    }

    public async logout(
        _req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            res.status(200).json({
                success: true,
                message: 'Cierre de sesión iniciado'
            });
            whatsAppClient.logout().catch(err => {
                console.error('[Session] Error cerrando sesión:', err);
            });
        } catch (error) {
            next(error);
        }
    }

    public async clearCache(
        _req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            res.status(200).json({
                success: true,
                message: 'Limpieza de caché y reinicio iniciados'
            });
            whatsAppClient.clearCacheAndRestart().catch(err => {
                console.error('[Session] Error limpiando caché:', err);
            });
        } catch (error) {
            next(error);
        }
    }

    public getStatus(
        _req: Request,
        res: Response,
        _next: NextFunction
    ): void {
        const state = whatsAppClient.getState();
        res.status(200).json({
            success: true,
            message: 'Estado obtenido',
            data: state
        });
    }

    public getLogs(
        req: Request,
        res: Response,
        _next: NextFunction
    ): void {
        const { limit, level, since } = req.query;

        const logs = logCapture.getLogs({
            limit: limit ? parseInt(limit as string, 10) : 500,
            level: level as any,
            since: since as string
        });

        res.status(200).json({
            success: true,
            message: `Se obtuvieron ${logs.length} logs`,
            data: logs
        });
    }
}

export const sessionController = new SessionController();
