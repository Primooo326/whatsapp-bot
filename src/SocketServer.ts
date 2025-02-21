import { Server } from 'socket.io';
import http from 'http';
import { WhatsAppClientFactory } from './WhatsAppClientFactory';

export class SocketServer {
    private io: Server;
    private clientFactory: WhatsAppClientFactory;

    constructor(server: http.Server) {
        this.io = new Server(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        this.clientFactory = WhatsAppClientFactory.getInstance();
        this.initialize();
    }

    private initialize(): void {
        this.io.on('connection', (socket) => {
            console.log('Cliente conectado:', socket.id);

            socket.on('start_session', async (sessionId: string) => {
                try {
                    console.log(`Iniciando sesión: ${sessionId}`);

                    if (this.clientFactory.getClient(sessionId)) {
                        socket.emit('session_error', {
                            sessionId,
                            error: 'Session already exists'
                        });
                        return;
                    }

                    // Configurar los listeners de eventos antes de crear el cliente
                    this.setupFactoryEventListeners(socket, sessionId);

                    await this.clientFactory.createClient(sessionId);

                    socket.emit('session_started', {
                        sessionId,
                        status: 'initializing'
                    });

                } catch (error: any) {
                    socket.emit('session_error', {
                        sessionId,
                        error: error.message
                    });
                }
            });

            socket.on('check_session', (sessionId: string) => {
                const isReady = this.clientFactory.isSessionReady(sessionId);
                socket.emit('session_status', {
                    sessionId,
                    isReady
                });
            });

            socket.on('get_all_sessions', () => {
                const sessions = this.clientFactory.getAllSessions();
                socket.emit('all_sessions', sessions);
            });

            socket.on('destroy_session', async (sessionId: string) => {
                try {
                    await this.clientFactory.destroySession(sessionId);
                    socket.emit('session_destroyed', {
                        sessionId,
                        status: 'success'
                    });
                } catch (error: any) {
                    socket.emit('session_error', {
                        sessionId,
                        error: error.message
                    });
                }
            });

            socket.on('disconnect', () => {
                console.log('Cliente desconectado:', socket.id);
            });
        });
    }
    private setupFactoryEventListeners(socket: any, sessionId: string): void {
        const eventHandler = (eventName: string) => (data: any) => {
            if (data.sessionId === sessionId) {
                socket.emit(eventName, data);
            }
        };

        this.clientFactory.on('qr', eventHandler('qr'));
        this.clientFactory.on('ready', eventHandler('session_ready'));
        this.clientFactory.on('authenticated', eventHandler('session_authenticated'));
        this.clientFactory.on('auth_failure', eventHandler('session_auth_failure'));

        // Limpiar los listeners cuando el socket se desconecte
        socket.on('disconnect', () => {
            this.clientFactory.removeListener('qr', eventHandler('qr'));
            this.clientFactory.removeListener('ready', eventHandler('session_ready'));
            this.clientFactory.removeListener('authenticated', eventHandler('session_authenticated'));
            this.clientFactory.removeListener('auth_failure', eventHandler('session_auth_failure'));
        });
    }

}