import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import { Server } from 'socket.io';
import * as fs from 'fs';
import * as qrTerminal from 'qrcode-terminal';

import { config } from '../config';
import { metricsService } from '../services/metrics.service';
import { FileUtils } from '../utils/FileUtils';
import { MessageQueue } from './MessageQueue';

class WhatsAppClient {
    private static instance: WhatsAppClient;
    private client: Client;
    private ready: boolean = false;
    private io: Server | null = null;
    private messageQueue: MessageQueue = new MessageQueue(3000);

    private constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth({ clientId: config.sessionId }),
            puppeteer: {
                ...(config.puppeteer || {}),
                protocolTimeout: 0 // Timeout infinito para evitar ProtocolError: Runtime.callFunctionOn
            },
            qrMaxRetries: 0, // 0 = unlimited retries
            webVersionCache: {
                type: 'remote',
                remotePath: 'https://raw.githubusercontent.com/AhmadMujtaba200210/legacy/main/2.3000.1017054254-alpha.html'
            }
        });

        this.setupEventListeners();
    }

    public static getInstance(): WhatsAppClient {
        if (!WhatsAppClient.instance) {
            WhatsAppClient.instance = new WhatsAppClient();
        }
        return WhatsAppClient.instance;
    }

    public setSocket(io: Server): void {
        this.io = io;
        console.log('[WhatsApp] Socket.io instance set');
    }

    private setupEventListeners(): void {
        this.client.on('qr', (qr) => {
            console.log('[WhatsApp] Escanea este código QR con tu teléfono (Socket actualizado):');
            qrTerminal.generate(qr, { small: true }); // Para la consola
            if (this.io) {
                this.io.emit('whatsapp_status', { state: 'UNAUTHENTICATED' });
                this.io.emit('whatsapp_qr', { qr });
            }
        });

        this.client.on('loading_screen', (percent, message) => {
            console.log(`[WhatsApp] Cargando: ${percent}% - ${message}`);
            if (this.io) {
                this.io.emit('whatsapp_status', { state: 'LOADING', percent, message });
            }
        });

        this.client.on('authenticated', () => {
            console.log('[WhatsApp] Autenticado con éxito');
            if (this.io) {
                this.io.emit('whatsapp_status', { state: 'AUTHENTICATED' });
            }
        });

        this.client.on('auth_failure', (msg) => {
            console.error('[WhatsApp] Error de autenticación:', msg);
            if (this.io) {
                this.io.emit('whatsapp_status', { state: 'AUTHENTICATION_FAILED', message: msg });
            }
        });

        this.client.on('ready', async () => {
            console.log('[WhatsApp] Cliente listo (evento ready)');
            this.ready = true;
            if (this.io) {
                this.io.emit('whatsapp_status', { state: 'CONNECTED' });
            }
            await metricsService.trackClientStatus('ready');
        });

        // @ts-ignore
        this.client.on('change_state', (state: string) => {
            console.log(`[WhatsApp] Estado cambiado a: ${state}`);
            if (this.io) {
                this.io.emit('whatsapp_status', { state });
            }
        });

        this.client.on('disconnected', async (reason) => {
            console.log('[WhatsApp] Desconectado:', reason);
            this.ready = false;
            if (this.io) {
                this.io.emit('whatsapp_status', { state: 'DISCONNECTED', reason });
            }
            await metricsService.trackClientStatus('disconnected', reason);
        });

        this.client.on('message_create', async (msg) => {
            // Ignorar los mensajes enviados por nosotros mismos
            if (msg.fromMe) return;

            if (this.io) {
                let contactName = '';
                let contactNumber = '';
                try {
                    const contact = await msg.getContact();
                    contactName = contact.name || contact.pushname || '';
                    contactNumber = contact.number || msg.from.split('@')[0];
                } catch (e) {
                    contactNumber = msg.from.split('@')[0];
                }

                let quotedMessageData = null;
                if (msg.hasQuotedMsg) {
                    quotedMessageData = await this.getQuotedMessageChain(msg);
                }

                this.io.emit('whatsapp_message', {
                    id: msg.id._serialized,
                    from: msg.from,
                    number: contactNumber,
                    name: contactName,
                    body: msg.body,
                    hasMedia: msg.hasMedia,
                    timestamp: msg.timestamp,
                    type: msg.type,
                    isGroup: msg.from.includes('@g.us'),
                    hasQuotedMsg: msg.hasQuotedMsg,
                    quotedMessage: quotedMessageData
                });
            }

        });

        // Capturar errores internos de la librería (conocido bug con 'update' undefined)
        process.on('uncaughtException', (error) => {
            if (error.message?.includes("Cannot read properties of undefined (reading 'update')")) {
                // Silenciar este error conocido de la librería
                console.log('[WhatsApp] Error interno ignorado (bug conocido de la librería)');
            } else {
                console.error('[Error no manejado]:', error);
            }
        });

        process.on('unhandledRejection', (reason: any) => {
            if (reason?.message?.includes("Cannot read properties of undefined (reading 'update')")) {
                // Silenciar este error conocido de la librería
                console.log('[WhatsApp] Promise rechazada ignorada (bug conocido de la librería)');
            } else {
                console.error('[Promesa rechazada no manejada]:', reason);
            }
        });

        console.log('[WhatsApp] Event listeners registrados correctamente');
    }

    private async getQuotedMessageChain(msg: any, depth = 0, maxDepth = 10): Promise<any> {
        if (!msg.hasQuotedMsg || depth >= maxDepth) return null;
        try {
            const quotedMsg = await msg.getQuotedMessage();
            if (!quotedMsg) return null;

            let quotedContactName = '';
            let quotedContactNumber = '';
            try {
                const quotedContact = await quotedMsg.getContact();
                quotedContactName = quotedContact.name || quotedContact.pushname || '';
                quotedContactNumber = quotedContact.number || quotedMsg.from?.split('@')[0] || '';
            } catch (e) {
                quotedContactNumber = quotedMsg.from?.split('@')[0] || '';
            }

            let nestedQuoted = null;
            if (quotedMsg.hasQuotedMsg) {
                nestedQuoted = await this.getQuotedMessageChain(quotedMsg, depth + 1, maxDepth);
            }

            return {
                id: quotedMsg.id?._serialized,
                from: quotedMsg.from,
                number: quotedContactNumber,
                name: quotedContactName,
                body: quotedMsg.body,
                hasMedia: quotedMsg.hasMedia,
                timestamp: quotedMsg.timestamp,
                type: quotedMsg.type,
                hasQuotedMsg: quotedMsg.hasQuotedMsg,
                quotedMessage: nestedQuoted
            };
        } catch (e) {
            console.error('[WhatsApp] Error obteniendo cadena de mensajes citados:', e);
            return null;
        }
    }

    public async initialize(): Promise<void> {
        console.log('[WhatsApp] Inicializando cliente...');

        return new Promise((resolve, reject) => {
            this.client.on('qr', (qr) => {
                console.log('[WhatsApp] Escanea este código QR con tu teléfono (Socket actualizado):');
                qrTerminal.generate(qr, { small: true }); // Para la consola
                if (this.io) {
                    this.io.emit('whatsapp_status', { state: 'UNAUTHENTICATED' });
                    this.io.emit('whatsapp_qr', { qr });
                }
                // Permitimos que la configuración de Express/Node continúe
                resolve();
            });

            this.client.once('ready', () => {
                console.log('[WhatsApp] Cliente listo (evento ready)');
                this.ready = true;
                resolve();
            });

            // Fallback: esperar después de autenticación y marcar como listo
            this.client.once('authenticated', () => {
                console.log('[WhatsApp] Autenticado, esperando evento ready...');

                setTimeout(() => {
                    if (this.ready) return;
                    console.log('[WhatsApp] Evento ready no recibido después de 60s, marcando como listo...');
                    this.ready = true;
                    resolve();
                }, 60000);
            });

            this.client.once('auth_failure', (msg) => {
                reject(new Error(`Auth failure: ${msg}`));
            });

            this.client.initialize().catch((error) => {
                reject(error);
            });
        });
    }

    public isReady(): boolean {
        return this.ready;
    }

    private async sendWithRetry(
        targetId: string,
        content: string | MessageMedia,
        options: any,
        retries: number
    ): Promise<void> {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                await this.client.sendMessage(targetId, content, options);
                return; // Éxito
            } catch (error: any) {
                const shouldRetry = error.message?.includes("Cannot read properties of undefined (reading 'update')") ||
                    error.message?.includes("Cannot read properties of undefined (reading 'getChat')") ||
                    error.message?.includes("Promise was collected") ||
                    error.message?.includes("Session closed") ||
                    error.message?.includes("Target closed") ||
                    error.message?.includes("ProtocolError") ||
                    error.message?.includes("timed out") ||
                    error.message?.includes("Runtime.callFunctionOn");
                    
                if (shouldRetry && attempt < retries) {
                    const delay = attempt * 5000; // 5s, 10s, 15s - tiempo de recuperación progresivo para Chromium
                    console.log(`[WhatsApp] Reintentando envío a ${targetId} (${attempt}/${retries}) en ${delay / 1000}s por error: ${error.message}`);
                    await new Promise(r => setTimeout(r, delay));
                } else {
                    throw error;
                }
            }
        }
    }

    public async sendMessage(
        phoneNumber: string,
        message: string,
        files: { multimedia?: string[], archivo?: string[] } = {},
        retries = 3,
        tags: string[] = [],
        envioMultimediaJunto: boolean = false,
        replyMessageId?: string
    ): Promise<void> {
        if (!this.ready) {
            throw new Error('WhatsApp client not ready');
        }

        const chatId = phoneNumber.includes('@') ? phoneNumber : `${phoneNumber.replace(/\D/g, '')}@c.us`;
        let messageSentWithMedia = false;

        // 1. Procesar Multimedia
        if (files.multimedia && files.multimedia.length > 0) {
            for (let i = 0; i < files.multimedia.length; i++) {
                const url = files.multimedia[i];
                const file = await FileUtils.downloadFile(url, 'multimedia');
                if (file) {
                    try {
                        const stats = fs.statSync(file.path);
                        if (stats.size > 50 * 1024 * 1024) {
                            throw new Error('El archivo excede el límite de 50MB');
                        }

                        const media = MessageMedia.fromFilePath(file.path);
                        let options: any = { caption: '' };
                        if (replyMessageId) options.quotedMessageId = replyMessageId;

                        const isFirst = (envioMultimediaJunto && i === 0 && message);
                        if (isFirst) {
                            options.caption = message; // Attach message as caption
                        }

                        await this.messageQueue.add(() => this.sendWithRetry(chatId, media, options, retries));

                        // Solo marcamos el mensaje como enviado si tuvimos éxito enviando la imagen
                        if (isFirst) {
                            messageSentWithMedia = true;
                        }

                        await metricsService.trackMediaSent(phoneNumber, 'multimedia', tags);
                    } catch (e: any) {
                        console.error(`[WhatsApp] Error enviando multimedia ${url} a ${phoneNumber}:`, e);
                        await metricsService.trackMediaFailed(phoneNumber, e.message, tags);
                        // No lanzamos el error para no colgar todo, pero el mensaje original (si tenía) sí se enviará después al fallar messageSentWithMedia
                    } finally {
                        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                    }
                }
            }
        }

        // 2. Enviar mensaje de texto si no se adjuntó junto a multimedia
        if (message && !messageSentWithMedia) {
            let options: any = {};
            if (replyMessageId) options.quotedMessageId = replyMessageId;
            try {
                await this.messageQueue.add(() => this.sendWithRetry(chatId, message, options, retries));
            } catch (e: any) {
                console.error(`[WhatsApp] Error enviando mensaje de texto a ${phoneNumber}:`, e);
            }
        }

        // 3. Procesar Archivos (sin caption)
        if (files.archivo && files.archivo.length > 0) {
            for (const url of files.archivo) {
                const file = await FileUtils.downloadFile(url, 'archivo');
                if (file) {
                    try {
                        const stats = fs.statSync(file.path);
                        if (stats.size > 50 * 1024 * 1024) throw new Error('El archivo excede el límite de 50MB');

                        const media = MessageMedia.fromFilePath(file.path);
                        let options: any = { sendMediaAsDocument: true };
                        if (replyMessageId) options.quotedMessageId = replyMessageId;

                        await this.messageQueue.add(() => this.sendWithRetry(chatId, media, options, retries));
                        await metricsService.trackFileSent(phoneNumber, 'archivo', tags);
                    } catch (e: any) {
                        console.error(`[WhatsApp] Error enviando archivo ${url} a ${phoneNumber}:`, e);
                        await metricsService.trackFileFailed(phoneNumber, e.message, tags);
                    } finally {
                        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                    }
                }
            }
        }
    }

    public async sendToMultiple(
        phoneNumbers: string[],
        message: string,
        files: { multimedia?: string[], archivo?: string[] } = {},
        tags: string[] = [],
        envioMultimediaJunto: boolean = true,
        replyMessageId?: string
    ): Promise<{ success: string[]; failed: string[] }> {
        const results = { success: [] as string[], failed: [] as string[] };

        for (const phone of phoneNumbers) {
            try {
                await this.sendMessage(phone, message, files, 3, tags, envioMultimediaJunto, replyMessageId);
                results.success.push(phone);
                // console.log(`[WhatsApp] Mensaje enviado a ${phone}`);
                await metricsService.trackMessageSent(phone, message.length, tags);
            } catch (error: any) {
                results.failed.push(phone);
                // console.error(`[WhatsApp] Error enviando a ${phone}:`, error);
                await metricsService.trackMessageFailed(phone, error.message || 'Unknown error', tags);
            }

            // La cola ya maneja la pausa entre mensajes, no se necesita delay adicional aquí
        }

        return results;
    }

    public async getGroups(): Promise<{ id: string; name: string; participants: string[] }[]> {
        if (!this.ready) {
            throw new Error('WhatsApp client not ready');
        }

        const chats = await this.client.getChats();
        const groups = chats.filter(chat => chat.isGroup);

        const groupsData = await Promise.all(
            groups.map(async (group) => {
                const chat = await this.client.getChatById(group.id._serialized);
                // @ts-ignore - participants exists on GroupChat
                const participants = chat.participants?.map((p: any) => p.id.user) || [];

                let imageUrl: string | undefined;
                try {
                    imageUrl = await this.client.getProfilePicUrl(group.id._serialized);
                } catch (e) {
                    // console.error(`[WhatsApp] Error obteniendo imagen para grupo ${group.name}:`, e);
                }

                return {
                    id: group.id._serialized,
                    name: group.name,
                    participants,
                    image: imageUrl
                };
            })
        );

        await metricsService.trackGroupsFetched(groupsData.length);
        return groupsData;
    }

    public async getChats(): Promise<{ name: string; number: string; image?: string }[]> {
        if (!this.ready) {
            throw new Error('WhatsApp client not ready');
        }

        const chats = await this.client.getChats();
        // Filter for individual chats (not groups)
        const individualChats = chats.filter(chat => !chat.isGroup);

        const chatsData = await Promise.all(
            individualChats.map(async (chat) => {
                let imageUrl: string | undefined;
                try {
                    imageUrl = await this.client.getProfilePicUrl(chat.id._serialized);
                } catch (e) {
                    // console.error(`[WhatsApp] Error obteniendo imagen para chat ${chat.name}:`, e);
                }

                return {
                    name: chat.name,
                    number: chat.id.user,
                    image: imageUrl
                };
            })
        );

        return chatsData;
    }

    public async getMediaFromMessage(messageId: string): Promise<{ data: string; mimetype: string; filename?: string } | null> {
        if (!this.ready) {
            throw new Error('WhatsApp client not ready');
        }

        try {
            // @ts-ignore - getMessageById might not be in the type definition but exists in the library
            const msg = await this.client.getMessageById(messageId);

            if (!msg) {
                console.warn(`[WhatsApp] Message ${messageId} not found`);
                return null;
            }

            if (!msg.hasMedia) {
                console.warn(`[WhatsApp] Message ${messageId} does not contain media`);
                return null;
            }

            const media = await msg.downloadMedia();
            if (!media) {
                console.warn(`[WhatsApp] Failed to download media for message ${messageId}`);
                return null;
            }

            return {
                data: media.data,
                mimetype: media.mimetype,
                filename: media.filename || undefined
            };
        } catch (error) {
            console.error(`[WhatsApp] Error fetching media for message ${messageId}:`, error);
            throw error;
        }
    }

    public async sendToGroup(
        groupId: string,
        message: string,
        files: { multimedia?: string[], archivo?: string[] } = {},
        retries = 3,
        tags: string[] = [],
        envioMultimediaJunto: boolean = false,
        replyMessageId?: string
    ): Promise<string> {
        if (!this.ready) {
            throw new Error('WhatsApp client not ready');
        }

        let messageSentWithMedia = false;

        // 1. Procesar Multimedia
        if (files.multimedia && files.multimedia.length > 0) {
            for (let i = 0; i < files.multimedia.length; i++) {
                const url = files.multimedia[i];
                const file = await FileUtils.downloadFile(url, 'multimedia');
                if (file) {
                    try {
                        const stats = fs.statSync(file.path);
                        if (stats.size > 50 * 1024 * 1024) throw new Error('El archivo excede el límite de 50MB');

                        const media = MessageMedia.fromFilePath(file.path);
                        let options: any = { caption: '' };
                        if (replyMessageId) options.quotedMessageId = replyMessageId;

                        const isFirst = (envioMultimediaJunto && i === 0 && message);
                        if (isFirst) {
                            options.caption = message; // Attach message as caption to the first image
                        }

                        await this.messageQueue.add(() => this.sendWithRetry(groupId, media, options, retries));

                        if (isFirst) {
                            messageSentWithMedia = true;
                        }

                        await metricsService.trackMediaSent(groupId, 'multimedia', tags);
                    } catch (e: any) {
                        console.error(`[WhatsApp] Error enviando multimedia al grupo ${groupId}:`, e);
                        await metricsService.trackMediaFailed(groupId, e.message, tags);
                    } finally {
                        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                    }
                }
            }
        }

        // 2. Enviar mensaje de texto
        if (message && !messageSentWithMedia) {
            let options: any = {};
            if (replyMessageId) options.quotedMessageId = replyMessageId;
            try {
                await this.messageQueue.add(() => this.sendWithRetry(groupId, message, options, retries));
            } catch (e: any) {
                console.error(`[WhatsApp] Error enviando mensaje de texto al grupo ${groupId}:`, e);
            }
        }

        // 3. Procesar Archivos
        if (files.archivo && files.archivo.length > 0) {
            for (const url of files.archivo) {
                const file = await FileUtils.downloadFile(url, 'archivo');
                if (file) {
                    try {
                        const stats = fs.statSync(file.path);
                        if (stats.size > 50 * 1024 * 1024) throw new Error('El archivo excede el límite de 50MB');

                        const media = MessageMedia.fromFilePath(file.path);
                        let options: any = { sendMediaAsDocument: true };
                        if (replyMessageId) options.quotedMessageId = replyMessageId;

                        await this.messageQueue.add(() => this.sendWithRetry(groupId, media, options, retries));
                        await metricsService.trackFileSent(groupId, 'archivo', tags);
                    } catch (e: any) {
                        console.error(`[WhatsApp] Error enviando archivo al grupo ${groupId}:`, e);
                        await metricsService.trackFileFailed(groupId, e.message, tags);
                    } finally {
                        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                    }
                }
            }
        }

        await metricsService.trackGroupMessageSent(groupId, groupId, message.length, tags);
        return groupId;
    }
}

export const whatsAppClient = WhatsAppClient.getInstance();
