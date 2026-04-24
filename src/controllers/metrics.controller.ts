import { Request, Response, NextFunction } from 'express';
import { metricsService } from '../services/metrics.service';
import { ApiResponse } from '../types';

interface MetricsResponse {
    today: {
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
    };
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

class MetricsController {
    public async getMetrics(
        _req: Request,
        res: Response<ApiResponse<MetricsResponse>>,
        next: NextFunction
    ): Promise<void> {
        try {
            const [todayMetrics, avgResponseTime, topSent, topFailed, topGroupsSent, topGroupsFailed] = await Promise.all([
                metricsService.getTodayMetrics(),
                metricsService.getAverageResponseTime(24),
                metricsService.getTopRecipients(10, 'sent'),
                metricsService.getTopRecipients(10, 'failed'),
                metricsService.getTopGroups(10, 'sent'),
                metricsService.getTopGroups(10, 'failed')
            ]);

            res.status(200).json({
                success: true,
                message: 'Métricas obtenidas exitosamente',
                data: {
                    today: todayMetrics,
                    avgResponseTimeMs: Math.round(avgResponseTime * 100) / 100,
                    topRecipients: {
                        sent: topSent,
                        failed: topFailed
                    },
                    topGroups: {
                        sent: topGroupsSent,
                        failed: topGroupsFailed
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    public async getMetricsByRange(
        req: Request,
        res: Response<ApiResponse>,
        next: NextFunction
    ): Promise<void> {
        try {
            const { startDate, endDate } = req.query;

            if (!startDate || !endDate) {
                res.status(400).json({
                    success: false,
                    message: 'Se requieren los parámetros startDate y endDate'
                });
                return;
            }

            const metrics = await metricsService.getMetricsByDateRange(
                new Date(startDate as string),
                new Date(endDate as string)
            );

            res.status(200).json({
                success: true,
                message: `Se encontraron ${metrics.total} eventos`,
                data: metrics
            });
        } catch (error) {
            next(error);
        }
    }

    public async getMonthlyReport(
        req: Request,
        res: Response<ApiResponse>,
        next: NextFunction
    ): Promise<void> {
        try {
            const { year, month } = req.query;

            if (!year || !month) {
                res.status(400).json({
                    success: false,
                    message: 'Se requieren los parámetros year y month'
                });
                return;
            }

            const yearNum = parseInt(year as string, 10);
            const monthNum = parseInt(month as string, 10);

            if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
                res.status(400).json({
                    success: false,
                    message: 'Año o mes inválido. El mes debe estar entre 1 y 12'
                });
                return;
            }

            const report = await metricsService.getMonthlyReport(yearNum, monthNum);

            res.status(200).json({
                success: true,
                message: `Reporte de ${monthNum}/${yearNum} generado`,
                data: report
            });
        } catch (error) {
            next(error);
        }
    }
}

export const metricsController = new MetricsController();

