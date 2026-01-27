import { Client, LocalAuth, Chat } from 'whatsapp-web.js';
import qrTerminal from 'qrcode-terminal';
import { config } from '../config';
import { metricsService } from '../services/metrics.service';

class WhatsAppClient {
    private static instance: WhatsAppClient;
    private client: Client;
    private ready: boolean = false;

    private constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth({ clientId: config.sessionId }),
            puppeteer: config.puppeteer
        });

        this.setupEventListeners();
    }

    public static getInstance(): WhatsAppClient {
        if (!WhatsAppClient.instance) {
            WhatsAppClient.instance = new WhatsAppClient();
        }
        return WhatsAppClient.instance;
    }

    private setupEventListeners(): void {
        this.client.on('qr', (qr) => {
            console.log('[WhatsApp] Escanea este código QR con tu teléfono:');
            qrTerminal.generate(qr, { small: true });
        });

        this.client.on('authenticated', () => {
            console.log('[WhatsApp] Autenticado con éxito');
        });

        this.client.on('auth_failure', (msg) => {
            console.error('[WhatsApp] Error de autenticación:', msg);
        });

        this.client.on('ready', async () => {
            console.log('[WhatsApp] Cliente listo');
            this.ready = true;
            await metricsService.trackClientStatus('ready');
        });

        this.client.on('disconnected', async (reason) => {
            console.log('[WhatsApp] Desconectado:', reason);
            this.ready = false;
            await metricsService.trackClientStatus('disconnected', reason);
        });
    }

    public async initialize(): Promise<void> {
        console.log('[WhatsApp] Inicializando cliente...');
        await this.client.initialize();
    }

    public isReady(): boolean {
        return this.ready;
    }

    public async sendMessage(phoneNumber: string, message: string): Promise<void> {
        if (!this.ready) {
            throw new Error('WhatsApp client not ready');
        }

        const chatId = phoneNumber.replace(/\D/g, '') + '@c.us';
        const chat: Chat = await this.client.getChatById(chatId);
        await chat.sendMessage(message, { sendSeen: false });
    }

    public async sendToMultiple(phoneNumbers: string[], message: string): Promise<{ success: string[]; failed: string[] }> {
        const results = { success: [] as string[], failed: [] as string[] };

        for (const phone of phoneNumbers) {
            try {
                await this.sendMessage(phone, message);
                results.success.push(phone);
                console.log(`[WhatsApp] Mensaje enviado a ${phone}`);
                await metricsService.trackMessageSent(phone, message.length);
            } catch (error: any) {
                results.failed.push(phone);
                console.error(`[WhatsApp] Error enviando a ${phone}:`, error);
                await metricsService.trackMessageFailed(phone, error.message || 'Unknown error');
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

                return {
                    id: group.id._serialized,
                    name: group.name,
                    participants
                };
            })
        );

        await metricsService.trackGroupsFetched(groupsData.length);
        return groupsData;
    }

    public async sendToGroup(groupId: string, message: string): Promise<string> {
        if (!this.ready) {
            throw new Error('WhatsApp client not ready');
        }

        const chat = await this.client.getChatById(groupId);

        if (!chat.isGroup) {
            throw new Error('El ID proporcionado no corresponde a un grupo');
        }

        try {
            await chat.sendMessage(message, { sendSeen: false });
            console.log(`[WhatsApp] Mensaje enviado al grupo ${chat.name}`);
            await metricsService.trackGroupMessageSent(groupId, chat.name, message.length);
            return chat.name;
        } catch (error: any) {
            await metricsService.trackGroupMessageFailed(groupId, error.message || 'Unknown error');
            throw error;
        }
    }
}

export const whatsAppClient = WhatsAppClient.getInstance();
