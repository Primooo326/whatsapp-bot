// ============================================
// WhatsApp Bot Dashboard — TypeScript Types
// ============================================

/** Estados posibles del cliente WhatsApp */
export type WhatsAppState =
  | 'CONNECTED'
  | 'UNAUTHENTICATED'
  | 'AUTHENTICATED'
  | 'AUTHENTICATION_FAILED'
  | 'LOADING'
  | 'DISCONNECTED'
  | 'RESTARTING'
  | 'LOGGING_OUT'
  | 'CLEARING_CACHE'
  | 'UNKNOWN';

/** Payload del evento whatsapp_status */
export interface WhatsAppStatusEvent {
  state: WhatsAppState;
  percent?: number;
  message?: string;
  reason?: string;
}

/** Payload del evento whatsapp_qr */
export interface WhatsAppQrEvent {
  qr: string;
}

/** Respuesta del endpoint /health */
export interface HealthResponse {
  status: string;
  whatsappReady: boolean;
  timestamp: string;
}

/** Respuesta del endpoint /session/status */
export interface SessionStatus {
  ready: boolean;
  sessionId: string;
}

/** Métricas de hoy */
export interface TodayMetrics {
  messagesSent: number;
  messagesFailed: number;
  groupMessagesSent: number;
  groupMessagesFailed: number;
  apiRequests: number;
  apiErrors: number;
  mediaSent: number;
  mediaFailed: number;
  filesSent: number;
  filesFailed: number;
}

/** Respuesta completa de /metrics */
export interface MetricsData {
  today: TodayMetrics;
  avgResponseTimeMs: number;
  topRecipients: {
    sent: { recipient: string; count: number }[];
    failed: { recipient: string; count: number }[];
  };
  topGroups: {
    sent: { groupId: string; groupName?: string; count: number }[];
    failed: { groupId: string; groupName?: string; count: number }[];
  };
}

/** Reporte mensual */
export interface MonthlyReport {
  year: number;
  month: number;
  summary: {
    totalMessagesSent: number;
    totalMessagesFailed: number;
    totalGroupMessagesSent: number;
    totalGroupMessagesFailed: number;
    totalMessages: number;
    successRate: number;
  };
  dailyBreakdown: {
    date: string;
    messagesSent: number;
    messagesFailed: number;
    groupMessagesSent: number;
    groupMessagesFailed: number;
    totalMessages: number;
  }[];
}

/** Entrada de log */
export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  source?: string;
}

/** Respuesta genérica de la API */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

/** Secciones de navegación del dashboard */
export type DashboardSection = 'status' | 'metrics' | 'logs';
