import { useState, useEffect, useCallback } from 'react';
import { socketService } from '../services/socket';
import { getHealth } from '../services/api';
import type { WhatsAppState, WhatsAppStatusEvent } from '../types';

interface UseWhatsAppReturn {
  /** Current WhatsApp client state */
  status: WhatsAppState;
  /** QR code string (only valid when status === 'UNAUTHENTICATED') */
  qrCode: string | null;
  /** Whether the WhatsApp client is ready to send messages */
  isReady: boolean;
  /** Whether the Socket.IO connection to the server is active */
  isSocketConnected: boolean;
  /** Loading percentage during LOADING state */
  loadingPercent: number | null;
  /** Additional message from status events */
  statusMessage: string | null;
  /** Last time the status was updated */
  lastUpdated: Date | null;
}

export function useWhatsApp(): UseWhatsAppReturn {
  const [status, setStatus] = useState<WhatsAppState>('UNKNOWN');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(socketService.isConnected());
  const [loadingPercent, setLoadingPercent] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch initial health
  const fetchHealth = useCallback(async () => {
    try {
      const health = await getHealth();
      setIsReady(health.whatsappReady);
      if (health.whatsappReady) {
        setStatus('CONNECTED');
        setQrCode(null);
      }
      setLastUpdated(new Date());
    } catch {
      // Backend might not be reachable
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10_000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  // Socket listeners
  useEffect(() => {
    const unsubStatus = socketService.onStatus((data: WhatsAppStatusEvent) => {
      setStatus(data.state);
      setLastUpdated(new Date());

      if (data.state === 'CONNECTED') {
        setIsReady(true);
        setQrCode(null);
        setLoadingPercent(null);
      } else if (data.state === 'UNAUTHENTICATED') {
        setIsReady(false);
      } else if (data.state === 'LOADING') {
        setLoadingPercent(data.percent ?? null);
        setStatusMessage(data.message ?? null);
      } else if (data.state === 'DISCONNECTED') {
        setIsReady(false);
        setQrCode(null);
        setStatusMessage(data.reason ?? null);
      } else {
        setIsReady(false);
      }
    });

    const unsubQr = socketService.onQr((data) => {
      setQrCode(data.qr);
      setStatus('UNAUTHENTICATED');
      setLastUpdated(new Date());
    });

    const unsubConn = socketService.onConnection((connected) => {
      setIsSocketConnected(connected);
    });

    return () => {
      unsubStatus();
      unsubQr();
      unsubConn();
    };
  }, []);

  return {
    status,
    qrCode,
    isReady,
    isSocketConnected,
    loadingPercent,
    statusMessage,
    lastUpdated,
  };
}
