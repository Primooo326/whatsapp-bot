import { Metric, MetricEventType, IMetric } from '../database/models/Metric';
import { config } from '../config';
import mongoose from 'mongoose';

class MetricsService {
    private static instance: MetricsService;

    public static getInstance(): MetricsService {
        if (!MetricsService.instance) {
            MetricsService.instance = new MetricsService();
        }
        return MetricsService.instance;
    }

    /**
     * Registra un evento de métrica
     */
    async trackEvent(eventType: MetricEventType, data: IMetric['data'] = {}): Promise<void> {
        if (mongoose.connection.readyState !== 1) return; // Skip if DB is not connected

        try {
            const metric = new Metric({
                eventType,
                timestamp: new Date(),
                data: {
                    ...data,
                    sessionId: config.sessionId
                }
            });
            await metric.save();
        } catch (error: any) {
            console.error(`[Metrics] Error guardando métrica: ${error.message || 'Fallo desconocido'}`);
        }
    }

    /**
     * Registra un mensaje enviado exitosamente
     */
    /**
     * Registra un mensaje enviado exitosamente
     */
    async trackMessageSent(recipient: string, messageLength: number, tags?: string[]): Promise<void> {
        await this.trackEvent('message_sent', { recipient, messageLength, tags });
    }

    /**
     * Registra un mensaje fallido
     */
    /**
     * Registra un mensaje fallido
     */
    async trackMessageFailed(recipient: string, errorMessage: string, tags?: string[]): Promise<void> {
        await this.trackEvent('message_failed', { recipient, errorMessage, tags });
    }

    /**
     * Registra un mensaje a grupo enviado
     */
    /**
     * Registra un mensaje a grupo enviado
     */
    async trackGroupMessageSent(groupId: string, groupName: string, messageLength: number, tags?: string[]): Promise<void> {
        await this.trackEvent('group_message_sent', { groupId, groupName, messageLength, tags });
    }

    /**
     * Registra un mensaje a grupo fallido
     */
    /**
     * Registra un mensaje a grupo fallido
     */
    async trackGroupMessageFailed(groupId: string, errorMessage: string, tags?: string[]): Promise<void> {
        await this.trackEvent('group_message_failed', { groupId, errorMessage, tags });
    }

    /**
     * Registra consulta de grupos
     */
    async trackGroupsFetched(groupCount: number): Promise<void> {
        await this.trackEvent('groups_fetched', { groupCount });
    }

    /**
     * Registra petición a la API
     */
    async trackApiRequest(
        endpoint: string,
        method: string,
        statusCode: number,
        responseTimeMs: number
    ): Promise<void> {
        await this.trackEvent('api_request', { endpoint, method, statusCode, responseTimeMs });
    }

    /**
     * Registra error en la API
     */
    async trackApiError(endpoint: string, method: string, errorMessage: string, statusCode: number): Promise<void> {
        await this.trackEvent('api_error', { endpoint, method, errorMessage, statusCode });
    }

    async trackClientStatus(status: 'ready' | 'disconnected', reason?: string): Promise<void> {
        const eventType = status === 'ready' ? 'client_ready' : 'client_disconnected';
        await this.trackEvent(eventType, { reason });
    }

    /**
     * Registra multimedia enviado
     */
    async trackMediaSent(recipient: string, type: string, tags?: string[]): Promise<void> {
        await this.trackEvent('media_sent', { recipient, type, tags });
    }

    /**
     * Registra multimedia fallido
     */
    async trackMediaFailed(recipient: string, errorMessage: string, tags?: string[]): Promise<void> {
        await this.trackEvent('media_failed', { recipient, errorMessage, tags });
    }

    /**
     * Registra archivo enviado
     */
    async trackFileSent(recipient: string, type: string, tags?: string[]): Promise<void> {
        await this.trackEvent('file_sent', { recipient, type, tags });
    }

    /**
     * Registra archivo fallido
     */
    async trackFileFailed(recipient: string, errorMessage: string, tags?: string[]): Promise<void> {
        await this.trackEvent('file_failed', { recipient, errorMessage, tags });
    }

    /**
     * Registra fallo de descarga
     */
    async trackDownloadFailed(url: string, errorMessage: string): Promise<void> {
        await this.trackEvent('download_failed', { url, errorMessage });
    }

    /**
     * Obtiene métricas de hoy
     */
    async getTodayMetrics(): Promise<{
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
    }> {
        const defaultMetrics = {
            messagesSent: 0, messagesFailed: 0, groupMessagesSent: 0, groupMessagesFailed: 0,
            apiRequests: 0, apiErrors: 0, mediaSent: 0, mediaFailed: 0, filesSent: 0, filesFailed: 0
        };

        if (mongoose.connection.readyState !== 1) return defaultMetrics;

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        try {
            const [
                messagesSent, messagesFailed, groupMessagesSent, groupMessagesFailed,
                apiRequests, apiErrors, mediaSent, mediaFailed, filesSent, filesFailed
            ] = await Promise.all([
                Metric.countDocuments({ eventType: 'message_sent', timestamp: { $gte: startOfDay } }),
                Metric.countDocuments({ eventType: 'message_failed', timestamp: { $gte: startOfDay } }),
                Metric.countDocuments({ eventType: 'group_message_sent', timestamp: { $gte: startOfDay } }),
                Metric.countDocuments({ eventType: 'group_message_failed', timestamp: { $gte: startOfDay } }),
                Metric.countDocuments({ eventType: 'api_request', timestamp: { $gte: startOfDay } }),
                Metric.countDocuments({ eventType: 'api_error', timestamp: { $gte: startOfDay } }),
                Metric.countDocuments({ eventType: 'media_sent', timestamp: { $gte: startOfDay } }),
                Metric.countDocuments({ eventType: 'media_failed', timestamp: { $gte: startOfDay } }),
                Metric.countDocuments({ eventType: 'file_sent', timestamp: { $gte: startOfDay } }),
                Metric.countDocuments({ eventType: 'file_failed', timestamp: { $gte: startOfDay } })
            ]);

            return {
                messagesSent, messagesFailed, groupMessagesSent, groupMessagesFailed,
                apiRequests, apiErrors, mediaSent, mediaFailed, filesSent, filesFailed
            };
        } catch (error) {
            return defaultMetrics;
        }
    }

    /**
     * Obtiene métricas por rango de fechas
     */
    async getMetricsByDateRange(startDate: Date, endDate: Date): Promise<{
        total: number;
        byType: Record<string, number>;
    }> {
        if (mongoose.connection.readyState !== 1) return { total: 0, byType: {} };

        try {
            const metrics = await Metric.aggregate([
                {
                    $match: {
                        timestamp: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $group: {
                        _id: '$eventType',
                        count: { $sum: 1 }
                    }
                }
            ]);

            const byType: Record<string, number> = {};
            let total = 0;

            metrics.forEach((m: { _id: string; count: number }) => {
                byType[m._id] = m.count;
                total += m.count;
            });

            return { total, byType };
        } catch (error) {
            return { total: 0, byType: {} };
        }
    }

    /**
     * Obtiene el tiempo de respuesta promedio de la API
     */
    async getAverageResponseTime(hours: number = 24): Promise<number> {
        if (mongoose.connection.readyState !== 1) return 0;

        const since = new Date(Date.now() - hours * 60 * 60 * 1000);

        try {
            const result = await Metric.aggregate([
                {
                    $match: {
                        eventType: 'api_request',
                        timestamp: { $gte: since },
                        'data.responseTimeMs': { $exists: true }
                    }
                },
                {
                    $group: {
                        _id: null,
                        avgResponseTime: { $avg: '$data.responseTimeMs' }
                    }
                }
            ]);

            return result[0]?.avgResponseTime || 0;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Obtiene métricas diarias desglosadas por día
     * Útil para reportes mensuales
     */
    async getDailyBreakdown(startDate: Date, endDate: Date): Promise<{
        date: string;
        messagesSent: number;
        messagesFailed: number;
        groupMessagesSent: number;
        groupMessagesFailed: number;
        totalMessages: number;
    }[]> {
        if (mongoose.connection.readyState !== 1) return [];

        try {
            const result = await Metric.aggregate([
                {
                    $match: {
                        timestamp: { $gte: startDate, $lte: endDate },
                        eventType: { $in: ['message_sent', 'message_failed', 'group_message_sent', 'group_message_failed'] }
                    }
                },
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
                            eventType: '$eventType'
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $group: {
                        _id: '$_id.date',
                        events: {
                            $push: {
                                type: '$_id.eventType',
                                count: '$count'
                            }
                        }
                    }
                },
                {
                    $sort: { _id: 1 }
                }
            ]);

            return result.map((day: any) => {
                const stats = {
                    date: day._id,
                    messagesSent: 0,
                    messagesFailed: 0,
                    groupMessagesSent: 0,
                    groupMessagesFailed: 0,
                    totalMessages: 0
                };

                day.events.forEach((e: { type: string; count: number }) => {
                    switch (e.type) {
                        case 'message_sent':
                            stats.messagesSent = e.count;
                            break;
                        case 'message_failed':
                            stats.messagesFailed = e.count;
                            break;
                        case 'group_message_sent':
                            stats.groupMessagesSent = e.count;
                            break;
                        case 'group_message_failed':
                            stats.groupMessagesFailed = e.count;
                            break;
                    }
                });

                stats.totalMessages = stats.messagesSent + stats.messagesFailed +
                    stats.groupMessagesSent + stats.groupMessagesFailed;

                return stats;
            });
        } catch (error) {
            return [];
        }
    }

    /**
     * Obtiene reporte mensual consolidado
     */
    async getMonthlyReport(year: number, month: number): Promise<{
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
    }> {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        const dailyBreakdown = await this.getDailyBreakdown(startDate, endDate);

        const summary = dailyBreakdown.reduce(
            (acc, day) => {
                acc.totalMessagesSent += day.messagesSent;
                acc.totalMessagesFailed += day.messagesFailed;
                acc.totalGroupMessagesSent += day.groupMessagesSent;
                acc.totalGroupMessagesFailed += day.groupMessagesFailed;
                acc.totalMessages += day.totalMessages;
                return acc;
            },
            {
                totalMessagesSent: 0,
                totalMessagesFailed: 0,
                totalGroupMessagesSent: 0,
                totalGroupMessagesFailed: 0,
                totalMessages: 0,
                successRate: 0
            }
        );

        const totalSent = summary.totalMessagesSent + summary.totalGroupMessagesSent;
        const totalAttempted = summary.totalMessages;
        summary.successRate = totalAttempted > 0
            ? Math.round((totalSent / totalAttempted) * 10000) / 100
            : 0;

        return {
            year,
            month,
            summary,
            dailyBreakdown
        };
    }

    /**
     * Obtiene los destinatarios con más mensajes (enviados o fallidos)
     */
    async getTopRecipients(limit: number = 10, type: 'sent' | 'failed' = 'sent'): Promise<{ recipient: string; count: number }[]> {
        if (mongoose.connection.readyState !== 1) return [];

        const eventType = type === 'sent' ? 'message_sent' : 'message_failed';

        try {
            const result = await Metric.aggregate([
                {
                    $match: { eventType }
                },
                {
                    $group: {
                        _id: '$data.recipient',
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { count: -1 }
                },
                {
                    $limit: limit
                },
                {
                    $project: {
                        _id: 0,
                        recipient: '$_id',
                        count: 1
                    }
                }
            ]);

            return result;
        } catch (error) {
            return [];
        }
    }

    /**
     * Obtiene los grupos con más mensajes (enviados o fallidos)
     */
    async getTopGroups(limit: number = 10, type: 'sent' | 'failed' = 'sent'): Promise<{ groupId: string; groupName?: string; count: number }[]> {
        if (mongoose.connection.readyState !== 1) return [];

        const eventType = type === 'sent' ? 'group_message_sent' : 'group_message_failed';

        try {
            const result = await Metric.aggregate([
                {
                    $match: { eventType }
                },
                {
                    $group: {
                        _id: '$data.groupId',
                        groupName: { $first: '$data.groupName' },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { count: -1 }
                },
                {
                    $limit: limit
                },
                {
                    $project: {
                        _id: 0,
                        groupId: '$_id',
                        groupName: 1,
                        count: 1
                    }
                }
            ]);

            return result;
        } catch (error) {
            return [];
        }
    }
}

export const metricsService = MetricsService.getInstance();

