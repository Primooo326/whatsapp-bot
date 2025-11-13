import { Client, LocalAuth } from 'whatsapp-web.js';
import { JobManager } from './jobs'; // Added initializeJobs import
import { CommandHandler } from './commands';
import { EventEmitter } from 'events';
import qrTerminal from "qrcode-terminal"
interface WhatsAppSession {
    client: Client;
    jobManager: JobManager | null;
    commandHandler: CommandHandler | null;
    isReady: boolean;
}

export class WhatsAppClientFactory extends EventEmitter {
    private static instance: WhatsAppClientFactory;
    private sessions: Map<string, WhatsAppSession>;

    private constructor() {
        super();
        this.sessions = new Map();
    }

    public static getInstance(): WhatsAppClientFactory {
        if (!WhatsAppClientFactory.instance) {
            WhatsAppClientFactory.instance = new WhatsAppClientFactory();
        }
        return WhatsAppClientFactory.instance;
    }
    public async createClient(sessionId: string): Promise<Client> {
        try {
            if (this.sessions.has(sessionId)) {
                throw new Error(`Session ${sessionId} already exists`);
            }

            const client = new Client({
                authStrategy: new LocalAuth({ clientId: sessionId }),
                puppeteer: {
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--no-first-run',
                        '--no-zygote',
                        '--single-process',
                        '--disable-gpu'
                    ]
                }
            });

            const session: WhatsAppSession = {
                client,
                jobManager: null,
                commandHandler: null,
                isReady: false
            };

            this.setupClientEvents(session, sessionId);
            this.sessions.set(sessionId, session);

            await client.initialize();
            return client;
        } catch (error) {
            console.error(`Error creating client for session ${sessionId}:`, error);
            throw error;
        }
    }

    private setupClientEvents(session: WhatsAppSession, sessionId: string): void {
        const { client } = session;

        client.on('qr', (qr) => {
            console.log(`[Session ${sessionId}] Escanea este código QR con tu WhatsApp:`);
            qrTerminal.generate(qr, { small: true });
            this.emit('qr', { sessionId, qr });
        });

        client.on('authenticated', () => {
            console.log(`[Session ${sessionId}] Autenticado con éxito`);
            this.emit('authenticated', { sessionId, timestamp: new Date().toISOString() });
        });

        client.on('auth_failure', (msg) => {
            console.error(`[Session ${sessionId}] Error de autenticación:`, msg);
            this.emit('auth_failure', { sessionId, error: msg });
        });

        client.on('ready', () => {
            console.log(`[Session ${sessionId}] El cliente está listo para usar`);
            session.isReady = true;
            session.jobManager = new JobManager();
            session.commandHandler = new CommandHandler(client, session.jobManager);

            const currentDate = new Date();
            client.sendMessage(client.info.wid._serialized, `[${currentDate.toLocaleString()}] El cliente está listo para usar`);

            this.emit('ready', { sessionId, timestamp: new Date().toISOString() });
        });

        client.on('message', async (message) => {
            if (session.commandHandler) {
                const contact = await message.getChat();
                await session.commandHandler.handleCommand(contact.id._serialized, message.body);
            }
        });
    }

    public getClient(sessionId: string): Client | undefined {
        return this.sessions.get(sessionId)?.client;
    }

    public isSessionReady(sessionId: string): boolean {
        return this.sessions.get(sessionId)?.isReady ?? false;
    }

    public getAllSessions(): string[] {
        return Array.from(this.sessions.keys());
    }

    public async destroySession(sessionId: string): Promise<void> {
        try {
            const session = this.sessions.get(sessionId);
            if (session) {
                await session.client.destroy();
                this.sessions.delete(sessionId);
            }
        } catch (error) {
            console.error(`Error destroying session ${sessionId}:`, error);
            throw error;
        }
    }
    public async sendMessage(sessionId: string, to: string[], message: string): Promise<void> {
        try {
            const session = this.sessions.get(sessionId);
            if (session) {
                const promises = to.map(async (contact) => await session.client.sendMessage(contact, message));
                await Promise.all(promises);
            }
        } catch (error) {
            console.error(`Error sending message for session ${sessionId}:`, error);
            throw error;
        }
    }
}