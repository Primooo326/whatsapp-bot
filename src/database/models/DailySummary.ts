import mongoose, { Schema, Document } from 'mongoose';

export interface IDailySummary extends Document {
    date: Date;  // Solo fecha, sin hora
    totalMessagesSent: number;
    totalMessagesFailed: number;
    totalGroupMessagesSent: number;
    totalGroupMessagesFailed: number;
    totalApiRequests: number;
    totalApiErrors: number;
    uniqueRecipients: number;
    uniqueGroups: number;
    avgResponseTimeMs: number;
}

const DailySummarySchema = new Schema<IDailySummary>({
    date: {
        type: Date,
        required: true,
        unique: true,
        index: true
    },
    totalMessagesSent: { type: Number, default: 0 },
    totalMessagesFailed: { type: Number, default: 0 },
    totalGroupMessagesSent: { type: Number, default: 0 },
    totalGroupMessagesFailed: { type: Number, default: 0 },
    totalApiRequests: { type: Number, default: 0 },
    totalApiErrors: { type: Number, default: 0 },
    uniqueRecipients: { type: Number, default: 0 },
    uniqueGroups: { type: Number, default: 0 },
    avgResponseTimeMs: { type: Number, default: 0 }
}, {
    timestamps: true,
    collection: 'daily_summaries'
});

export const DailySummary = mongoose.model<IDailySummary>('DailySummary', DailySummarySchema);
