import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import { Server } from 'socket.io';
import * as fs from 'fs';
import * as qrTerminal from 'qrcode-terminal';

import { config } from '../config';
import { metricsService } from '../services/metrics.service';
import { FileUtils } from '../utils/FileUtils';

class WhatsAppClient {
    private static instance: WhatsAppClient;
    private client: Client;
    private ready: boolean = false;
    private io: Server | null = null;

    private constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth({ clientId: config.sessionId }),
            puppeteer: config.puppeteer,
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
                    try {
                        const quotedMsg = await msg.getQuotedMessage();
                        let quotedContactName = '';
                        let quotedContactNumber = '';

                        try {
                            const quotedContact = await quotedMsg.getContact();
                            quotedContactName = quotedContact.name || quotedContact.pushname || '';
                            quotedContactNumber = quotedContact.number || quotedMsg.from?.split('@')[0] || '';
                        } catch (e) {
                            quotedContactNumber = quotedMsg.from?.split('@')[0] || '';
                        }

                        quotedMessageData = {
                            id: quotedMsg.id?._serialized,
                            from: quotedMsg.from,
                            number: quotedContactNumber,
                            name: quotedContactName,
                            body: quotedMsg.body,
                            hasMedia: quotedMsg.hasMedia,
                            timestamp: quotedMsg.timestamp,
                            type: quotedMsg.type
                        };
                    } catch (e) {
                        console.error('[WhatsApp] Error obteniendo mensaje citado:', e);
                    }
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

    public async initialize(): Promise<void> {
        console.log('[WhatsApp] Inicializando cliente...');

        return new Promise((resolve, reject) => {
            // const timeout = setTimeout(() => {
            //     reject(new Error('Timeout: WhatsApp client failed to become ready within 5 minutes'));
            // }, 3000); // 5 minutos de timeout para escaneo de QR

            this.client.on('qr', (qr) => {
                console.log('[WhatsApp] Escanea este código QR con tu teléfono (Socket actualizado):');
                qrTerminal.generate(qr, { small: true }); // Para la consola
                if (this.io) {
                    this.io.emit('whatsapp_status', { state: 'UNAUTHENTICATED' });
                    this.io.emit('whatsapp_qr', { qr });
                }
            });

            this.client.once('ready', () => {
                console.log('[WhatsApp] Cliente listo (evento ready)');
                // clearTimeout(timeout);
                this.ready = true;
                resolve();
            });

            // Fallback: esperar después de autenticación y marcar como listo
            this.client.once('authenticated', () => {
                console.log('[WhatsApp] Autenticado, esperando evento ready...');

                // Después de 60 segundos, si ready no llegó, marcar como listo de todas formas
                setTimeout(() => {
                    if (this.ready) return;

                    console.log('[WhatsApp] Evento ready no recibido después de 60s, marcando como listo...');
                    // clearTimeout(timeout);
                    this.ready = true;

                    resolve();
                }, 60000);
            });

            this.client.once('auth_failure', (msg) => {
                // clearTimeout(timeout);
                reject(new Error(`Auth failure: ${msg}`));
            });

            this.client.initialize().catch((error) => {
                // clearTimeout(timeout);
                reject(error);
            });
        });
    }

    public isReady(): boolean {
        return this.ready;
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

        const chatId = phoneNumber.replace(/\D/g, '') + '@c.us';

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                let messageSentWithMedia = false;

                // 2. Process Multimedia
                if (files.multimedia && files.multimedia.length > 0) {
                    for (let i = 0; i < files.multimedia.length; i++) {
                        const url = files.multimedia[i];
                        const file = await FileUtils.downloadFile(url, 'multimedia');
                        if (file) {
                            try {
                                const media = MessageMedia.fromFilePath(file.path);

                                // Logic for envioMultimediaJunto
                                let options: any = { caption: '' };
                                if (replyMessageId) options.quotedMessageId = replyMessageId;

                                if (envioMultimediaJunto && i === 0 && message) {
                                    options.caption = message; // Attach message as caption to the first image
                                    messageSentWithMedia = true;
                                }

                                await this.client.sendMessage(chatId, media, options);
                                await metricsService.trackMediaSent(phoneNumber, 'multimedia', tags);
                            } catch (e: any) {
                                console.error(`[WhatsApp] Error enviando multimedia ${url}:`, e);
                                await metricsService.trackMediaFailed(phoneNumber, e.message, tags);
                            } finally {
                                // Delete file
                                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                            }
                        }
                    }
                }

                // 1. Send text message if exists AND wasn't sent with media
                if (message && !messageSentWithMedia) {
                    let options: any = {};
                    let replied = false;
                    if (replyMessageId) {
                        try {
                            const quotedMsg = await this.client.getMessageById(replyMessageId);
                            if (quotedMsg) {
                                await quotedMsg.reply(message, chatId);
                                replied = true;
                            }
                        } catch (e) {
                            console.warn(`[WhatsApp] No se pudo encontrar el mensaje original para responder (ID: ${replyMessageId}), enviando como mensaje normal.`);
                        }
                        options.quotedMessageId = replyMessageId;
                    }
                    if (!replied) {
                        await this.client.sendMessage(chatId, message, options);
                    }
                }

                // 3. Process Archivos
                if (files.archivo && files.archivo.length > 0) {
                    for (const url of files.archivo) {
                        const file = await FileUtils.downloadFile(url, 'archivo');
                        if (file) {
                            try {
                                const media = MessageMedia.fromFilePath(file.path);
                                // Send as document
                                let options: any = { sendMediaAsDocument: true };
                                if (replyMessageId) options.quotedMessageId = replyMessageId;

                                await this.client.sendMessage(chatId, media, options);
                                await metricsService.trackFileSent(phoneNumber, 'archivo', tags);
                            } catch (e: any) {
                                // console.error(`[WhatsApp] Error enviando archivo ${url}:`, e);
                                await metricsService.trackFileFailed(phoneNumber, e.message, tags);
                            } finally {
                                // Delete file
                                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                            }
                        }
                    }
                }

                return; // Success
            } catch (error: any) {
                const isUpdateError = error.message?.includes("Cannot read properties of undefined (reading 'update')") ||
                    error.message?.includes("Cannot read properties of undefined (reading 'getChat')");

                if (isUpdateError && attempt < retries) {
                    const delay = attempt * 2000;
                    console.log(`[WhatsApp] Reintentando envío (${attempt}/${retries}) en ${delay / 1000}s...`);
                    await new Promise(r => setTimeout(r, delay));
                } else {
                    throw error;
                }
            }
        }
    }

    public async sendToMultiple(
        phoneNumbers: string[],
        message: string,
        files: { multimedia?: string[], archivo?: string[] } = {},
        tags: string[] = [],
        envioMultimediaJunto: boolean = false,
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
                    console.error(`[WhatsApp] Error obteniendo imagen para grupo ${group.name}:`, e);
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

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                let messageSentWithMedia = false;

                // 2. Process Multimedia
                if (files.multimedia && files.multimedia.length > 0) {
                    for (let i = 0; i < files.multimedia.length; i++) {
                        const url = files.multimedia[i];
                        const file = await FileUtils.downloadFile(url, 'multimedia');
                        if (file) {
                            try {
                                const media = MessageMedia.fromFilePath(file.path);

                                // Logic for envioMultimediaJunto
                                let options: any = { caption: '' };
                                if (replyMessageId) options.quotedMessageId = replyMessageId;

                                if (envioMultimediaJunto && i === 0 && message) {
                                    options.caption = message;
                                    messageSentWithMedia = true;
                                }

                                await this.client.sendMessage(groupId, media, options);
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

                // 1. Send text message if exists AND wasn't sent with media
                if (message && !messageSentWithMedia) {
                    let options: any = {};
                    let replied = false;
                    if (replyMessageId) {
                        try {
                            const quotedMsg = await this.client.getMessageById(replyMessageId);
                            if (quotedMsg) {
                                await quotedMsg.reply(message, groupId);
                                replied = true;
                            }
                        } catch (e) {
                            console.warn(`[WhatsApp] No se pudo encontrar el mensaje original para responder (ID: ${replyMessageId}), enviando como mensaje normal.`);
                        }
                        options.quotedMessageId = replyMessageId;
                    }
                    if (!replied) {
                        await this.client.sendMessage(groupId, message, options);
                    }
                }

                // 3. Process Archivos
                if (files.archivo && files.archivo.length > 0) {
                    for (const url of files.archivo) {
                        const file = await FileUtils.downloadFile(url, 'archivo');
                        if (file) {
                            try {
                                const media = MessageMedia.fromFilePath(file.path);
                                let options: any = { sendMediaAsDocument: true };
                                if (replyMessageId) options.quotedMessageId = replyMessageId;

                                await this.client.sendMessage(groupId, media, options);
                                await metricsService.trackFileSent(groupId, 'archivo', tags);
                            } catch (e: any) {
                                // console.error(`[WhatsApp] Error enviando archivo al grupo ${groupId}:`, e);
                                await metricsService.trackFileFailed(groupId, e.message, tags);
                            } finally {
                                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                            }
                        }
                    }
                }

                // console.log(`[WhatsApp] Mensaje enviado al grupo ${groupId}`);
                await metricsService.trackGroupMessageSent(groupId, groupId, message.length, tags);
                return groupId;
            } catch (error: any) {
                const isUpdateError = error.message?.includes("Cannot read properties of undefined (reading 'update')") ||
                    error.message?.includes("Cannot read properties of undefined (reading 'getChat')");

                if (isUpdateError && attempt < retries) {
                    const delay = attempt * 2000;
                    console.log(`[WhatsApp] Reintentando envío a grupo (${attempt}/${retries}) en ${delay / 1000}s...`);
                    await new Promise(r => setTimeout(r, delay));
                } else {
                    await metricsService.trackGroupMessageFailed(groupId, error.message || 'Unknown error', tags);
                    throw error;
                }
            }
        }
        throw new Error('No se pudo enviar el mensaje al grupo después de varios intentos');
    }
}

export const whatsAppClient = WhatsAppClient.getInstance();
