import { Router, Request, Response } from 'express';
import { messageController } from '../controllers/message.controller';
import { metricsController } from '../controllers/metrics.controller';
import { sessionController } from '../controllers/session.controller';
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

// Job status (fire-and-forget tracking)
router.get('/jobs/:id', (req, res, next) => messageController.getJobStatus(req, res, next));

// Queue status
router.get('/queue/status', (req, res, next) => messageController.getQueueStatus(req, res, next));

// Get all groups
router.get('/groups', (req, res, next) => messageController.getGroups(req, res, next));

// Get all chats
router.get('/chats', (req, res, next) => messageController.getChats(req, res, next));

// Get media by message ID
router.get('/messages/:id/media', (req, res, next) => messageController.getMedia(req, res, next));

// Send message to a group
router.post('/groups/send', (req, res, next) => messageController.sendToGroup(req, res, next));

// Metrics endpoints
router.get('/metrics', (req, res, next) => metricsController.getMetrics(req, res, next));
router.get('/metrics/range', (req, res, next) => metricsController.getMetricsByRange(req, res, next));
router.get('/metrics/monthly', (req, res, next) => metricsController.getMonthlyReport(req, res, next));

// Session management endpoints
router.get('/session/status', (req, res, next) => sessionController.getStatus(req, res, next));
router.post('/session/restart', (req, res, next) => sessionController.restart(req, res, next));
router.post('/session/logout', (req, res, next) => sessionController.logout(req, res, next));
router.post('/session/clear', (req, res, next) => sessionController.clearCache(req, res, next));

// Logs endpoint
router.get('/logs', (req, res, next) => sessionController.getLogs(req, res, next));

export default router;