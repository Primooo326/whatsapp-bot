import mongoose, { Schema, Document } from 'mongoose';

// Tipos de eventos de métricas
export type MetricEventType =
    | 'message_sent'           // Mensaje individual enviado
    | 'message_failed'         // Mensaje individual fallido
    | 'group_message_sent'     // Mensaje a grupo enviado
    | 'group_message_failed'   // Mensaje a grupo fallido
    | 'groups_fetched'         // Grupos consultados
    | 'client_ready'           // Cliente WhatsApp listo
    | 'client_disconnected'    // Cliente desconectado
    | 'api_request'            // Petición a la API
    | 'api_error'              // Error en la API
    | 'media_sent'             // Multimedia enviado
    | 'media_failed'           // Multimedia fallido
    | 'file_sent'              // Archivo enviado
    | 'file_failed'            // Archivo fallido
    | 'download_failed';       // Error de descarga

export interface IMetric extends Document {
    eventType: MetricEventType;
    timestamp: Date;
    data: {
        // Para mensajes
        recipient?: string;
        groupId?: string;
        groupName?: string;
        messageLength?: number;
        // Para API requests
        endpoint?: string;
        method?: string;
        statusCode?: number;
        responseTimeMs?: number;
        // Para errores
        errorMessage?: string;
        errorCode?: string;
        // Metadata adicional
        sessionId?: string;
        tags?: string[];
        [key: string]: any;
    };
}

const MetricSchema = new Schema<IMetric>({
    eventType: {
        type: String,
        required: true,
        enum: [
            'message_sent',
            'message_failed',
            'group_message_sent',
            'group_message_failed',
            'groups_fetched',
            'client_ready',
            'client_disconnected',
            'api_request',
            'api_error',
            'media_sent',
            'media_failed',
            'file_sent',
            'file_failed',
            'download_failed'
        ],
        index: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    data: {
        type: Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: false,
    collection: 'metrics'
});

// Índices compuestos para consultas comunes
MetricSchema.index({ eventType: 1, timestamp: -1 });
MetricSchema.index({ 'data.endpoint': 1, timestamp: -1 });

export const Metric = mongoose.model<IMetric>('Metric', MetricSchema);
