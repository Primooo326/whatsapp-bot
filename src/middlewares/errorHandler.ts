import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

export class AppError extends Error {
    constructor(
        public statusCode: number,
        message: string
    ) {
        super(message);
        this.name = 'AppError';
    }
}

export const errorHandler = (
    err: Error,
    _req: Request,
    res: Response<ApiResponse>,
    _next: NextFunction
): void => {
    // Ignorar error conocido de whatsapp-web.js
    if (err.message?.includes("Cannot read properties of undefined (reading 'update')")) {
        console.log('[WhatsApp] Error interno ignorado (bug conocido)');
        return;
    }

    console.error('[Error]:', err.message);

    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message
        });
        return;
    }

    res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
    });
};
