import mongoose from 'mongoose';
import { config } from '../config';

export const connectDatabase = async (): Promise<void> => {
    try {
        await mongoose.connect(config.mongodb.uri);
        console.log('[MongoDB] Conectado a la base de datos');
    } catch (error) {
        console.error('[MongoDB] Error de conexión:', error);
        throw error;
    }
};

export const disconnectDatabase = async (): Promise<void> => {
    await mongoose.disconnect();
    console.log('[MongoDB] Desconectado de la base de datos');
};
