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

        // Evento 'message_create': Captura TODOS los mensajes (propios y recibidos)
        // Usamos este en lugar de 'message' porque en versiones alpha 'message' puede no emitirse
        this.client.on('message_create', async (msg) => {
            // Mensajes PROPIOS: detectar comandos como /financer
            if (msg.fromMe) {
                if (msg.body?.startsWith('/financer')) {
                    const mensaje = msg.body.replace('/financer', '').trim();

                    if (mensaje) {
                        console.log(`[Bot] Comando /financer detectado: "${mensaje}"`);

                        try {
                            const response = await fetch('https://n8n.primooo.dev/webhook/bot-financer', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ mensaje })
                            });

                            if (response.ok) {
                                console.log('[Bot] Mensaje enviado al webhook correctamente');
                            } else {
                                console.error('[Bot] Error del webhook:', response.status, response.statusText);
                            }
                        } catch (error: any) {
                            console.error('[Bot] Error enviando al webhook:', error.message);
                        }
                    }
                }
            } else {
                // Mensajes RECIBIDOS de otros
                console.log('========================================');
                console.log('[WhatsApp] 📩 MENSAJE RECIBIDO:');
                console.log(`  - De: ${msg.from}`);
                console.log(`  - Tipo: ${msg.type}`);
                console.log(`  - Cuerpo: ${msg.body?.substring(0, 100) || '(sin texto)'}${(msg.body?.length || 0) > 100 ? '...' : ''}`);
                console.log(`  - Tiene media: ${msg.hasMedia}`);
                console.log(`  - Es de grupo: ${msg.from.includes('@g.us')}`);
                console.log(`  - Timestamp: ${new Date(msg.timestamp * 1000).toISOString()}`);
                console.log('========================================');

                // Aquí puedes agregar tu lógica para procesar mensajes entrantes
                // Por ejemplo, responder automáticamente, guardar en BD, etc.

                // Ejemplo: detectar comandos entrantes (con prefijo !)
                if (msg.body?.startsWith('!')) {
                    const comando = msg.body.split(' ')[0].toLowerCase();
                    console.log(`[WhatsApp] Comando detectado: ${comando}`);

                    // Puedes emitir eventos o llamar a handlers específicos aquí
                    // this.handleIncomingCommand(msg, comando);
                }
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

    public async sendMessage(phoneNumber: string, message: string, retries = 3): Promise<void> {
        if (!this.ready) {
            throw new Error('WhatsApp client not ready');
        }

        const chatId = phoneNumber.replace(/\D/g, '') + '@c.us';

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                await this.client.sendMessage(chatId, message);
                return; // Éxito, salir
            } catch (error: any) {
                const isUpdateError = error.message?.includes("Cannot read properties of undefined (reading 'update')") ||
                    error.message?.includes("Cannot read properties of undefined (reading 'getChat')");

                if (isUpdateError && attempt < retries) {
                    const delay = attempt * 2000; // 2s, 4s, 6s
                    console.log(`[WhatsApp] Reintentando envío (${attempt}/${retries}) en ${delay / 1000}s...`);
                    await new Promise(r => setTimeout(r, delay));
                } else {
                    throw error; // Si no es ese error o ya se acabaron los reintentos
                }
            }
        }
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

    public async sendToGroup(groupId: string, message: string, retries = 3): Promise<string> {
        if (!this.ready) {
            throw new Error('WhatsApp client not ready');
        }

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                // Usar client.sendMessage directamente para evitar el bug de getChatById
                await this.client.sendMessage(groupId, message);
                console.log(`[WhatsApp] Mensaje enviado al grupo ${groupId}`);
                await metricsService.trackGroupMessageSent(groupId, groupId, message.length);
                return groupId;
            } catch (error: any) {
                const isUpdateError = error.message?.includes("Cannot read properties of undefined (reading 'update')") ||
                    error.message?.includes("Cannot read properties of undefined (reading 'getChat')");

                if (isUpdateError && attempt < retries) {
                    const delay = attempt * 2000;
                    console.log(`[WhatsApp] Reintentando envío a grupo (${attempt}/${retries}) en ${delay / 1000}s...`);
                    await new Promise(r => setTimeout(r, delay));
                } else {
                    await metricsService.trackGroupMessageFailed(groupId, error.message || 'Unknown error');
                    throw error;
                }
            }
        }
        throw new Error('No se pudo enviar el mensaje al grupo después de varios intentos');
    }
}

export const whatsAppClient = WhatsAppClient.getInstance();
