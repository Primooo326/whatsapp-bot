import { Router, Request, Response } from 'express';
import { messageController } from '../controllers/message.controller';
import { metricsController } from '../controllers/metrics.controller';
import { whatsAppClient } from '../core/WhatsAppClient';
import { HealthResponse } from '../types';

const router = Router();

// Health check endpoint
router.get('/health', (_req: Request, res: Response<HealthResponse>) => {
    res.json({
        status: 'ok',
        whatsappReady: whatsAppClient.isReady(),
        timestamp: new Date().toISOString()
    });
});

// Send message to individual contacts
router.post('/send', (req, res, next) => messageController.sendMessage(req, res, next));

// Get all groups
router.get('/groups', (req, res, next) => messageController.getGroups(req, res, next));

// Send message to a group
router.post('/groups/send', (req, res, next) => messageController.sendToGroup(req, res, next));

// Metrics endpoints
router.get('/metrics', (req, res, next) => metricsController.getMetrics(req, res, next));
router.get('/metrics/range', (req, res, next) => metricsController.getMetricsByRange(req, res, next));
router.get('/metrics/monthly', (req, res, next) => metricsController.getMonthlyReport(req, res, next));

export default router;