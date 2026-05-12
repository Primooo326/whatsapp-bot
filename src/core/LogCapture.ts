import { Server } from 'socket.io';

export interface LogEntry {
    timestamp: string;
    level: 'info' | 'warn' | 'error';
    message: string;
    source?: string;
}

/**
 * Captura de logs en memoria con buffer circular.
 * Intercepta console.log/warn/error y almacena las últimas N entradas.
 * Opcionalmente emite los logs por Socket.IO en tiempo real.
 */
class LogCapture {
    private static instance: LogCapture;
    private buffer: LogEntry[] = [];
    private maxSize: number;
    private io: Server | null = null;

    private originalLog: typeof console.log;
    private originalWarn: typeof console.warn;
    private originalError: typeof console.error;

    private constructor(maxSize: number = 2000) {
        this.maxSize = maxSize;
        this.originalLog = console.log.bind(console);
        this.originalWarn = console.warn.bind(console);
        this.originalError = console.error.bind(console);
    }

    public static getInstance(maxSize?: number): LogCapture {
        if (!LogCapture.instance) {
            LogCapture.instance = new LogCapture(maxSize);
        }
        return LogCapture.instance;
    }

    public setSocket(io: Server): void {
        this.io = io;
    }

    /**
     * Comienza a interceptar console.log/warn/error
     */
    public startCapture(): void {
        console.log = (...args: any[]) => {
            this.originalLog(...args);
            this.addEntry('info', args);
        };

        console.warn = (...args: any[]) => {
            this.originalWarn(...args);
            this.addEntry('warn', args);
        };

        console.error = (...args: any[]) => {
            this.originalError(...args);
            this.addEntry('error', args);
        };

        this.originalLog('[LogCapture] Captura de logs iniciada');
    }

    private addEntry(level: LogEntry['level'], args: any[]): void {
        const message = args
            .map(arg => {
                if (typeof arg === 'string') return arg;
                try {
                    return JSON.stringify(arg, null, 0);
                } catch {
                    return String(arg);
                }
            })
            .join(' ');

        // Extraer fuente del mensaje si sigue el patrón [Source]
        const sourceMatch = message.match(/^\[([^\]]+)\]/);
        const source = sourceMatch ? sourceMatch[1] : undefined;

        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            source
        };

        // Buffer circular
        if (this.buffer.length >= this.maxSize) {
            this.buffer.shift();
        }
        this.buffer.push(entry);

        // Emit por socket en tiempo real
        if (this.io) {
            this.io.emit('whatsapp_log', entry);
        }
    }

    /**
     * Obtiene los logs almacenados
     */
    public getLogs(options?: {
        limit?: number;
        level?: LogEntry['level'];
        since?: string;
    }): LogEntry[] {
        let logs = [...this.buffer];

        if (options?.level) {
            logs = logs.filter(l => l.level === options.level);
        }

        if (options?.since) {
            const sinceDate = new Date(options.since);
            logs = logs.filter(l => new Date(l.timestamp) >= sinceDate);
        }

        if (options?.limit && options.limit > 0) {
            logs = logs.slice(-options.limit);
        }

        return logs;
    }

    /**
     * Limpia el buffer de logs
     */
    public clear(): void {
        this.buffer = [];
    }

    public getBufferSize(): number {
        return this.buffer.length;
    }
}

export const logCapture = LogCapture.getInstance();
