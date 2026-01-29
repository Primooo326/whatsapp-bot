import { Client, LocalAuth } from 'whatsapp-web.js';
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
            puppeteer: config.puppeteer,
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

    private setupEventListeners(): void {
        this.client.on('qr', (qr) => {
            console.log('[WhatsApp] Escanea este código QR con tu teléfono:');
            qrTerminal.generate(qr, { small: true });
        });

        this.client.on('loading_screen', (percent, message) => {
            console.log(`[WhatsApp] Cargando: ${percent}% - ${message}`);
        });

        this.client.on('authenticated', () => {
            console.log('[WhatsApp] Autenticado con éxito');
        });

        this.client.on('auth_failure', (msg) => {
            console.error('[WhatsApp] Error de autenticación:', msg);
        });

        this.client.on('ready', async () => {
            console.log('[WhatsApp] Cliente listo (evento ready)');
            this.ready = true;
            await metricsService.trackClientStatus('ready');
        });

        // @ts-ignore - Este evento existe en algunas versiones
        this.client.on('change_state', (state: string) => {
            console.log(`[WhatsApp] Estado cambiado a: ${state}`);
        });

        this.client.on('disconnected', async (reason) => {
            console.log('[WhatsApp] Desconectado:', reason);
            this.ready = false;
            await metricsService.trackClientStatus('disconnected', reason);
        });

        // Catch-all para debug
        this.client.on('message', () => {
            if (!this.ready) {
                console.log('[WhatsApp] Recibido mensaje - marcando cliente como listo');
                this.ready = true;
            }
        });
    }

    public async initialize(): Promise<void> {
        console.log('[WhatsApp] Inicializando cliente...');

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Timeout: WhatsApp client failed to become ready within 5 minutes'));
            }, 300000); // 5 minutos de timeout para escaneo de QR

            this.client.once('ready', () => {
                console.log('[WhatsApp] Cliente listo (evento ready)');
                clearTimeout(timeout);
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
                    clearTimeout(timeout);
                    this.ready = true;
                    resolve();
                }, 60000);
            });

            this.client.once('auth_failure', (msg) => {
                clearTimeout(timeout);
                reject(new Error(`Auth failure: ${msg}`));
            });

            this.client.initialize().catch((error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }

    public isReady(): boolean {
        return this.ready;
    }

    public async sendMessage(phoneNumber: string, message: string): Promise<void> {
        if (!this.ready) {
            throw new Error('WhatsApp client not ready');
        }

        const chatId = phoneNumber.replace(/\D/g, '') + '@c.us';
        await this.client.sendMessage(chatId, message);
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
