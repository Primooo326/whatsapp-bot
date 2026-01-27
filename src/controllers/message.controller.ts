import { Request, Response, NextFunction } from 'express';
import { whatsAppClient } from '../core/WhatsAppClient';
import { SendMessageRequest, SendGroupMessageRequest, ApiResponse, GroupInfo } from '../types';
import { AppError } from '../middlewares/errorHandler';

class MessageController {
    public async sendMessage(
        req: Request<object, ApiResponse, SendMessageRequest>,
        res: Response<ApiResponse>,
        next: NextFunction
    ): Promise<void> {
        try {
            const { to, message } = req.body;

            // Validación
            if (!to || !Array.isArray(to) || to.length === 0) {
                throw new AppError(400, 'El campo "to" es requerido y debe ser un array de números');
            }

            if (!message || typeof message !== 'string') {
                throw new AppError(400, 'El campo "message" es requerido');
            }

            if (!whatsAppClient.isReady()) {
                throw new AppError(503, 'El cliente de WhatsApp no está listo');
            }

            const results = await whatsAppClient.sendToMultiple(to, message);

            res.status(200).json({
                success: true,
                message: `Mensajes enviados: ${results.success.length}, fallidos: ${results.failed.length}`,
                data: results
            });
        } catch (error) {
            next(error);
        }
    }

    public async getGroups(
        _req: Request,
        res: Response<ApiResponse<GroupInfo[]>>,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!whatsAppClient.isReady()) {
                throw new AppError(503, 'El cliente de WhatsApp no está listo');
            }

            const groups = await whatsAppClient.getGroups();

            res.status(200).json({
                success: true,
                message: `Se encontraron ${groups.length} grupos`,
                data: groups
            });
        } catch (error) {
            next(error);
        }
    }

    public async sendToGroup(
        req: Request<object, ApiResponse, SendGroupMessageRequest>,
        res: Response<ApiResponse>,
        next: NextFunction
    ): Promise<void> {
        try {
            const { groupId, message } = req.body;

            if (!groupId || typeof groupId !== 'string') {
                throw new AppError(400, 'El campo "groupId" es requerido');
            }

            if (!message || typeof message !== 'string') {
                throw new AppError(400, 'El campo "message" es requerido');
            }

            if (!whatsAppClient.isReady()) {
                throw new AppError(503, 'El cliente de WhatsApp no está listo');
            }

            await whatsAppClient.sendToGroup(groupId, message);

            res.status(200).json({
                success: true,
                message: 'Mensaje enviado al grupo exitosamente'
            });
        } catch (error) {
            next(error);
        }
    }
}

export const messageController = new MessageController();