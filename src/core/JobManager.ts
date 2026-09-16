import crypto from 'crypto';

export interface JobStatus {
    id: string;
    total: number;
    sent: number;
    failed: { recipient: string; error: string }[];
    status: 'queued' | 'processing' | 'completed';
    queuedAt: number;
    completedAt?: number;
}

export class JobManager {
    private static instance: JobManager;
    private jobs = new Map<string, JobStatus>();
    private static readonly TTL_MS = 2 * 60 * 60 * 1000; // 2 horas

    static getInstance(): JobManager {
        if (!JobManager.instance) JobManager.instance = new JobManager();
        return JobManager.instance;
    }

    create(total: number): string {
        const id = crypto.randomBytes(8).toString('hex');
        this.jobs.set(id, {
            id,
            total,
            sent: 0,
            failed: [],
            status: total === 0 ? 'completed' : 'queued',
            queuedAt: Date.now(),
        });
        setTimeout(() => this.jobs.delete(id), JobManager.TTL_MS);
        return id;
    }

    recordSuccess(id: string, recipient: string): void {
        const job = this.jobs.get(id);
        if (!job) return;
        job.sent++;
        if (job.status === 'queued') job.status = 'processing';
        if (job.sent + job.failed.length >= job.total) {
            job.status = 'completed';
            job.completedAt = Date.now();
        }
    }

    recordFailure(id: string, recipient: string, error: string): void {
        const job = this.jobs.get(id);
        if (!job) return;
        job.failed.push({ recipient, error });
        if (job.status === 'queued') job.status = 'processing';
        if (job.sent + job.failed.length >= job.total) {
            job.status = 'completed';
            job.completedAt = Date.now();
        }
    }

    get(id: string): JobStatus | undefined {
        return this.jobs.get(id);
    }
}

export const jobManager = JobManager.getInstance();
