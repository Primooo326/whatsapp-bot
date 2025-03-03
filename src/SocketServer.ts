import { Server } from 'socket.io';
import http from 'http';
import { WhatsAppClientFactory } from './WhatsAppClientFactory';
import pool from './config/database'; // Importa tu conexión a la base de datos

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
        this.io.on('connection', async (socket) => {
            console.log('Cliente conectado:', socket.id);

            socket.on('authenticate', async (idUser: string) => {
                try {
                    await this.updateSessionInDatabase(socket.id, idUser);

                } catch (error) {
                    console.error('Error al iniciar sesión:', error);
                }
            });

            // Actualiza la base de datos con la sessionId cuando elusuarios se conecta
            socket.on('start_session', async (idBot: string) => {
                try {
                    // Verifica si la sesión ya existe
                    if (this.clientFactory.getClient(idBot)) {
                        socket.emit('session_error', {
                            sessionId: idBot,
                            error: 'Session already exists'
                        });
                        return;
                    }

                    // Actualiza la base de datos con la sessionId

                    // Configurar los listeners de eventos antes de crear el cliente
                    this.setupFactoryEventListeners(socket, idBot);

                    await this.clientFactory.createClient(idBot);

                    socket.emit('session_started', {
                        sessionId: idBot,
                        status: 'initializing'
                    });

                } catch (error: any) {
                    console.error("Error al iniciar la sesión:", error);
                    socket.emit('session_error', {
                        sessionId: idBot,
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
                this.updateSessionInDatabase(socket.id);
            });

        });
    }

    private async updateSessionInDatabase(socketId: string, id?: string): Promise<void> {
        try {

            if (id) {
                const query = "UPDATEusuarios SET sessionId = ? WHERE uuid = ?";
                const [result]: any = await pool.query(query, [socketId, id]);

                if (result.affectedRows === 0) {
                    console.warn(`No se encontró unusuarios con sessionId: ${id}`);
                } else {
                    console.log(`Base de datos actualizada con sessionId: ${id}`);
                }
            } else {
                const query = "UPDATEusuarios SET sessionId = NULL WHERE sessionId = ?";
                const [result]: any = await pool.query(query, [socketId]);

                if (result.affectedRows === 0) {
                    console.warn(`No se encontró unusuarios con sessionId: ${socketId}`);
                } else {
                    console.log(`Base de datos actualizada con sessionId: ${socketId}`);
                }
            }

        } catch (error) {
            console.error("Error al actualizar la base de datos:", error);
        }
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