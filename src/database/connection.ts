import mongoose from 'mongoose';
import { config } from '../config';

export const connectDatabase = async (): Promise<void> => {
    try {
        await mongoose.connect(config.mongodb.uri, {
            serverSelectionTimeoutMS: 5000 // Don't hang forever
        });
        
        // Verify authentication proactively by pinging or fetching collections
        const db = mongoose.connection.db;
        if (!db) throw new Error("DB connection failed silently");
        
        // Attempt to list collections to verify permissions
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);

        console.log('[MongoDB] Conectado a la base de datos');

        if (!collectionNames.includes('metrics')) {
            await db.createCollection('metrics');
            console.log('[MongoDB] Colección "metrics" creada');
        }
        if (!collectionNames.includes('daily_summaries')) {
            await db.createCollection('daily_summaries');
            console.log('[MongoDB] Colección "daily_summaries" creada');
        }
    } catch (error: any) {
        // Desconectar si hubo un fallo parcial de autenticación para que readyState sea 0
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect().catch(() => {});
        }
        console.warn('\n======================================================');
        console.warn('⚠️  ALERTA: No se pudo conectar a MongoDB');
        console.warn('⚠️  La base de datos es necesaria para registrar y');
        console.warn('⚠️  visualizar las métricas en el dashboard.');
        console.warn('⚠️  El servidor continuará funcionando sin métricas.');
        console.warn('======================================================\n');
        // We do NOT throw error here so the app can start without MongoDB
    }
};

export const disconnectDatabase = async (): Promise<void> => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
        console.log('[MongoDB] Desconectado de la base de datos');
    }
};
