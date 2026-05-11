import { useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { RotateCcw, LogOut, Trash2, Loader2, CheckCircle2, XCircle, Clock, QrCode } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { restartSession, logoutSession, clearSession } from '../services/api';
import type { WhatsAppState } from '../types';

interface StatusPanelProps {
  status: WhatsAppState;
  qrCode: string | null;
  isReady: boolean;
  loadingPercent: number | null;
  statusMessage: string | null;
  lastUpdated: Date | null;
}

const statusConfig: Record<string, { color: string; bgColor: string; label: string; icon: React.ReactNode }> = {
  CONNECTED: {
    color: 'text-success',
    bgColor: 'bg-success',
    label: 'Conectado',
    icon: <CheckCircle2 size={18} />,
  },
  UNAUTHENTICATED: {
    color: 'text-warning',
    bgColor: 'bg-warning',
    label: 'Esperando QR',
    icon: <QrCode size={18} />,
  },
  AUTHENTICATED: {
    color: 'text-info',
    bgColor: 'bg-info',
    label: 'Autenticado',
    icon: <CheckCircle2 size={18} />,
  },
  LOADING: {
    color: 'text-info',
    bgColor: 'bg-info',
    label: 'Cargando',
    icon: <Loader2 size={18} className="animate-spin" />,
  },
  DISCONNECTED: {
    color: 'text-error',
    bgColor: 'bg-error',
    label: 'Desconectado',
    icon: <XCircle size={18} />,
  },
  RESTARTING: {
    color: 'text-info',
    bgColor: 'bg-info',
    label: 'Reiniciando...',
    icon: <Loader2 size={18} className="animate-spin" />,
  },
  LOGGING_OUT: {
    color: 'text-warning',
    bgColor: 'bg-warning',
    label: 'Cerrando sesión...',
    icon: <Loader2 size={18} className="animate-spin" />,
  },
  CLEARING_CACHE: {
    color: 'text-warning',
    bgColor: 'bg-warning',
    label: 'Limpiando caché...',
    icon: <Loader2 size={18} className="animate-spin" />,
  },
  AUTHENTICATION_FAILED: {
    color: 'text-error',
    bgColor: 'bg-error',
    label: 'Fallo de autenticación',
    icon: <XCircle size={18} />,
  },
  UNKNOWN: {
    color: 'text-text-muted',
    bgColor: 'bg-text-muted',
    label: 'Desconocido',
    icon: <Clock size={18} />,
  },
};

type ModalAction = 'restart' | 'logout' | 'clear' | null;

export function StatusPanel({ status, qrCode, isReady, loadingPercent, statusMessage, lastUpdated }: StatusPanelProps) {
  const [modalAction, setModalAction] = useState<ModalAction>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const cfg = statusConfig[status] || statusConfig.UNKNOWN;

  const handleAction = useCallback(async () => {
    if (!modalAction) return;
    setActionLoading(true);
    try {
      switch (modalAction) {
        case 'restart':
          await restartSession();
          break;
        case 'logout':
          await logoutSession();
          break;
        case 'clear':
          await clearSession();
          break;
      }
    } catch (err) {
      console.error('Error ejecutando acción:', err);
    } finally {
      setActionLoading(false);
      setModalAction(null);
    }
  }, [modalAction]);

  const modalConfig = {
    restart: {
      title: 'Reiniciar Cliente',
      description: 'Se reiniciará el cliente de WhatsApp. Los mensajes en cola podrían perderse. ¿Continuar?',
      confirmLabel: 'Reiniciar',
      variant: 'warning' as const,
    },
    logout: {
      title: 'Cerrar Sesión',
      description: 'Se cerrará la sesión activa de WhatsApp. Necesitarás escanear el QR de nuevo para conectar.',
      confirmLabel: 'Cerrar Sesión',
      variant: 'danger' as const,
    },
    clear: {
      title: 'Limpiar Caché',
      description: 'Se eliminarán todos los datos de sesión y caché del navegador. Esto requiere una nueva autenticación completa.',
      confirmLabel: 'Limpiar y Reiniciar',
      variant: 'danger' as const,
    },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Estado del Bot</h2>
        <p className="text-sm text-text-secondary mt-1">Gestión de sesión y estado de conexión de WhatsApp</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Status Card */}
        <div className="glass rounded-3xl p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Estado Actual</h3>
            {lastUpdated && (
              <span className="text-[0.65rem] text-text-muted">
                {lastUpdated.toLocaleTimeString('es-CO')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Animated status dot */}
            <div className="relative">
              <div className={`h-4 w-4 rounded-full ${cfg.bgColor} animate-pulse-glow ${cfg.color}`} />
              <div className={`absolute inset-0 h-4 w-4 rounded-full ${cfg.bgColor} opacity-30 animate-ping`} />
            </div>
            <div>
              <p className={`text-lg font-bold ${cfg.color}`}>{cfg.label}</p>
              <p className="text-xs text-text-muted">{status}</p>
            </div>
          </div>

          {/* Loading progress */}
          {status === 'LOADING' && loadingPercent !== null && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-text-secondary">
                <span>{statusMessage || 'Cargando...'}</span>
                <span>{loadingPercent}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-surface-hover overflow-hidden">
                <div
                  className="h-full rounded-full bg-linear-to-r from-info to-whatsapp transition-all duration-500"
                  style={{ width: `${loadingPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Ready badge */}
          <div className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium ${
            isReady 
              ? 'bg-success/10 text-success border border-success/20' 
              : 'bg-error/10 text-error border border-error/20'
          }`}>
            {isReady ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
            {isReady ? 'Listo para enviar mensajes' : 'No disponible para envío'}
          </div>
        </div>

        {/* QR Code Card */}
        <div className="glass rounded-3xl p-8 flex flex-col items-center justify-center min-h-[300px]">
          {qrCode ? (
            <div className="space-y-4 animate-fade-in text-center">
              <div className="flex items-center gap-2 text-warning">
                <QrCode size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">Escanea el QR</span>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-lg shadow-whatsapp/10">
                <QRCodeSVG
                  value={qrCode}
                  size={200}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#1a1a2e"
                />
              </div>
              <p className="text-xs text-text-muted max-w-[200px]">
                Abre WhatsApp en tu teléfono y escanea este código
              </p>
            </div>
          ) : (
            <div className="text-center space-y-3">
              <div className={`flex h-16 w-16 mx-auto items-center justify-center rounded-2xl ${
                isReady ? 'bg-success/10 text-success' : 'bg-surface-hover text-text-muted'
              }`}>
                {cfg.icon}
              </div>
              <p className="text-sm text-text-secondary">
                {isReady
                  ? 'Sesión activa — sin QR pendiente'
                  : status === 'UNKNOWN'
                    ? 'Conectando con el servidor...'
                    : 'Esperando código QR...'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="glass rounded-3xl p-8">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
          Gestión de Sesión
        </h3>
        <div className="flex flex-wrap gap-3">
          <button
            id="btn-restart"
            onClick={() => setModalAction('restart')}
            className="flex items-center gap-2 rounded-xl bg-info/10 px-5 py-3 text-sm font-medium text-info 
                       border border-info/20 hover:bg-info/20 transition-all duration-200"
          >
            <RotateCcw size={18} />
            Reiniciar
          </button>
          <button
            id="btn-logout"
            onClick={() => setModalAction('logout')}
            className="flex items-center gap-2 rounded-xl bg-warning/10 px-5 py-3 text-sm font-medium text-warning 
                       border border-warning/20 hover:bg-warning/20 transition-all duration-200"
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
          <button
            id="btn-clear"
            onClick={() => setModalAction('clear')}
            className="flex items-center gap-2 rounded-xl bg-error/10 px-5 py-3 text-sm font-medium text-error 
                       border border-error/20 hover:bg-error/20 transition-all duration-200"
          >
            <Trash2 size={18} />
            Limpiar Caché
          </button>
        </div>
      </div>

      {/* Confirm Modal */}
      {modalAction && (
        <ConfirmModal
          open={!!modalAction}
          loading={actionLoading}
          onConfirm={handleAction}
          onCancel={() => setModalAction(null)}
          {...modalConfig[modalAction]}
        />
      )}
    </div>
  );
}
