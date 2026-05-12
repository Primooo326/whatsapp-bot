import { io, Socket } from 'socket.io-client';
import type { WhatsAppStatusEvent, WhatsAppQrEvent, LogEntry } from '../types';

type StatusCallback = (data: WhatsAppStatusEvent) => void;
type QrCallback = (data: WhatsAppQrEvent) => void;
type LogCallback = (entry: LogEntry) => void;
type ConnectionCallback = (connected: boolean) => void;

class SocketService {
  private static instance: SocketService;
  private socket: Socket;

  private statusListeners: StatusCallback[] = [];
  private qrListeners: QrCallback[] = [];
  private logListeners: LogCallback[] = [];
  private connectionListeners: ConnectionCallback[] = [];

  private constructor() {
    // In dev, Vite proxy handles /socket.io.
    // In prod, connect to same origin.
    this.socket = io({
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: Infinity,
    });

    this.socket.on('connect', () => {
      this.connectionListeners.forEach((cb) => cb(true));
    });

    this.socket.on('disconnect', () => {
      this.connectionListeners.forEach((cb) => cb(false));
    });

    this.socket.on('whatsapp_status', (data: WhatsAppStatusEvent) => {
      this.statusListeners.forEach((cb) => cb(data));
    });

    this.socket.on('whatsapp_qr', (data: WhatsAppQrEvent) => {
      this.qrListeners.forEach((cb) => cb(data));
    });

    this.socket.on('whatsapp_log', (entry: LogEntry) => {
      this.logListeners.forEach((cb) => cb(entry));
    });
  }

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  // ─── Subscription helpers ──────────────────
  onStatus(cb: StatusCallback): () => void {
    this.statusListeners.push(cb);
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== cb);
    };
  }

  onQr(cb: QrCallback): () => void {
    this.qrListeners.push(cb);
    return () => {
      this.qrListeners = this.qrListeners.filter((l) => l !== cb);
    };
  }

  onLog(cb: LogCallback): () => void {
    this.logListeners.push(cb);
    return () => {
      this.logListeners = this.logListeners.filter((l) => l !== cb);
    };
  }

  onConnection(cb: ConnectionCallback): () => void {
    this.connectionListeners.push(cb);
    return () => {
      this.connectionListeners = this.connectionListeners.filter((l) => l !== cb);
    };
  }

  isConnected(): boolean {
    return this.socket.connected;
  }
}

export const socketService = SocketService.getInstance();
