import { Request, Response, NextFunction } from 'express';
import { whatsAppClient } from '../core/WhatsAppClient';
import { SendMessageRequest, SendGroupMessageRequest, ApiResponse, GroupInfo, ChatInfo } from '../types';
import { AppError } from '../middlewares/errorHandler';

class MessageController {
    public async sendMessage(
        req: Request<object, ApiResponse, SendMessageRequest>,
        res: Response<ApiResponse>,
        next: NextFunction
    ): Promise<void> {
        try {
            const { to, message, multimedia, archivo, tags, envioMultimediaJunto, replyMessageId } = req.body;

            // Validación
            if (!to || !Array.isArray(to) || to.length === 0) {
                throw new AppError(400, 'El campo "to" es requerido y debe ser un array de números');
            }

            if (!message && (!multimedia || multimedia.length === 0) && (!archivo || archivo.length === 0)) {
                throw new AppError(400, 'Se requiere "message", "multimedia" o "archivo"');
            }

            if (multimedia && (!Array.isArray(multimedia) || multimedia.some(url => typeof url !== 'string'))) {
                throw new AppError(400, 'El campo "multimedia" debe ser un array de URLs (strings)');
            }

            if (archivo && (!Array.isArray(archivo) || archivo.some(url => typeof url !== 'string'))) {
                throw new AppError(400, 'El campo "archivo" debe ser un array de URLs (strings)');
            }

            if (tags && (!Array.isArray(tags) || tags.some(tag => typeof tag !== 'string'))) {
                throw new AppError(400, 'El campo "tags" debe ser un array de strings');
            }

            if (!whatsAppClient.isReady()) {
                throw new AppError(503, 'El cliente de WhatsApp no está listo');
            }

            const groupsFiltered = to.filter((number) => number.endsWith('@g.us'));

            const numbersFiltered = to.filter((number) => !number.endsWith('@g.us'));

            let resultsGroup: { success: string[]; failed: string[] } = { success: [], failed: [] };

            if (groupsFiltered.length > 0) {

                const groupsFilteredSend = groupsFiltered.map(async (group) => {
                    await whatsAppClient.sendToGroup(group, message, { multimedia, archivo }, 3, tags, envioMultimediaJunto, replyMessageId);
                    resultsGroup.success.push(group);

                });

                await Promise.all(groupsFilteredSend);

            }

            const results = await whatsAppClient.sendToMultiple(numbersFiltered, message, { multimedia, archivo }, tags, envioMultimediaJunto, replyMessageId);

            // Merge group results
            results.success.push(...resultsGroup.success);
            results.failed.push(...resultsGroup.failed);

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

    public async getChats(
        _req: Request,
        res: Response<ApiResponse<ChatInfo[]>>,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!whatsAppClient.isReady()) {
                throw new AppError(503, 'El cliente de WhatsApp no está listo');
            }

            const chats = await whatsAppClient.getChats();

            res.status(200).json({
                success: true,
                message: `Se encontraron ${chats.length} chats`,
                data: chats
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
            const { groupId, message, multimedia, archivo, tags, envioMultimediaJunto, replyMessageId } = req.body;

            if (!groupId || typeof groupId !== 'string') {
                throw new AppError(400, 'El campo "groupId" es requerido');
            }

            if (!message && (!multimedia || multimedia.length === 0) && (!archivo || archivo.length === 0)) {
                throw new AppError(400, 'Se requiere "message", "multimedia" o "archivo"');
            }

            if (multimedia && (!Array.isArray(multimedia) || multimedia.some(url => typeof url !== 'string'))) {
                throw new AppError(400, 'El campo "multimedia" debe ser un array de URLs (strings)');
            }

            if (archivo && (!Array.isArray(archivo) || archivo.some(url => typeof url !== 'string'))) {
                throw new AppError(400, 'El campo "archivo" debe ser un array de URLs (strings)');
            }

            if (tags && (!Array.isArray(tags) || tags.some(tag => typeof tag !== 'string'))) {
                throw new AppError(400, 'El campo "tags" debe ser un array de strings');
            }

            if (!whatsAppClient.isReady()) {
                throw new AppError(503, 'El cliente de WhatsApp no está listo');
            }

            await whatsAppClient.sendToGroup(groupId, message, { multimedia, archivo }, 3, tags, envioMultimediaJunto, replyMessageId);

            res.status(200).json({
                success: true,
                message: 'Mensaje enviado al grupo exitosamente'
            });
        } catch (error) {
            next(error);
        }
    }

    public async getMedia(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const { id } = req.params;

            if (!id || typeof id !== 'string') {
                throw new AppError(400, 'El parámetro "id" es requerido y deben ser un string');
            }

            if (!whatsAppClient.isReady()) {
                throw new AppError(503, 'El cliente de WhatsApp no está listo');
            }

            const media = await whatsAppClient.getMediaFromMessage(id);

            if (!media) {
                throw new AppError(404, 'Media no encontrada o mensaje expirado');
            }

            // Set headers
            res.setHeader('Content-Type', media.mimetype);
            if (media.filename) {
                res.setHeader('Content-Disposition', `attachment; filename="${media.filename}"`);
            } else {
                const extension = media.mimetype.split('/')[1]?.split(';')[0] || 'bin';
                res.setHeader('Content-Disposition', `attachment; filename="${id}.${extension}"`);
            }

            // Convert base64 to buffer and send
            const buffer = Buffer.from(media.data, 'base64');
            res.send(buffer);
        } catch (error) {
            next(error);
        }
    }
}

export const messageController = new MessageController();