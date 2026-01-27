import express from 'express';
import cors from 'cors';
import { config } from './config';
import { connectDatabase } from './database/connection';
import { whatsAppClient } from './core/WhatsAppClient';
import messageRoutes from './routes/message.routes';
import { errorHandler } from './middlewares/errorHandler';
import { metricsMiddleware } from './middlewares/metrics.middleware';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(metricsMiddleware);

// Routes
app.use('/api/wha', messageRoutes);

// Error handler (debe ir al final)
app.use(errorHandler);

// Start server
const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDatabase();

        // Initialize WhatsApp client
        await whatsAppClient.initialize();

        app.listen(config.port, () => {
            console.log(`[Server] Running on port ${config.port}`);
            console.log(`[Server] Endpoints:`);
            console.log(`  - GET  /api/wha/health`);
            console.log(`  - POST /api/wha/send`);
            console.log(`  - GET  /api/wha/groups`);
            console.log(`  - POST /api/wha/groups/send`);
            console.log(`  - GET  /api/wha/metrics`);
            console.log(`  - GET  /api/wha/metrics/range`);
        });
    } catch (error) {
        console.error('[Server] Error starting:', error);
        process.exit(1);
    }
};

startServer();