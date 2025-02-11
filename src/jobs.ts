import cron from 'node-cron';
import { Client, Chat } from 'whatsapp-web.js';

// Interfaces
interface JobConfig {
    client: Client;
    phoneNumber: string;
    message: string;
    date?: string;
    cronExpression?: string;
}

interface JobData {
    job: BaseJob;
    task: cron.ScheduledTask;
}

// Clase base para los jobs
abstract class BaseJob {
    protected phoneNumber: string;
    protected message: string;
    protected client: Client;

    constructor(client: Client, phoneNumber: string, message: string) {
        this.client = client;
        this.phoneNumber = phoneNumber;
        this.message = message;
    }

    async execute(): Promise<void> {
        try {
            const chatId = this.phoneNumber + "@c.us";
            const chat: Chat = await this.client.getChatById(chatId);
            await chat.sendMessage(this.message);
            console.log(`Mensaje enviado a ${this.phoneNumber}: ${this.message}`);
        } catch (error) {
            console.error('Error al ejecutar job:', error);
        }
    }

    abstract getCronExpression(): string;
}

// Job para mensajes únicos
class OneTimeJob extends BaseJob {
    private date: Date;

    constructor(client: Client, phoneNumber: string, message: string, date: string) {
        super(client, phoneNumber, message);
        this.date = new Date(date);
    }

    getCronExpression(): string {
        return `${this.date.getMinutes()} ${this.date.getHours()} ${this.date.getDate()} ${this.date.getMonth() + 1} *`;
    }
}

// Job para mensajes recurrentes
class RecurringJob extends BaseJob {
    private cronExpression: string;

    constructor(client: Client, phoneNumber: string, message: string, cronExpression: string) {
        super(client, phoneNumber, message);
        this.cronExpression = cronExpression;
    }

    getCronExpression(): string {
        return this.cronExpression;
    }
}

// Factory para crear jobs
class JobFactory {
    static createJob(type: 'oneTime' | 'recurring', config: JobConfig): BaseJob {
        switch (type) {
            case 'oneTime':
                if (!config.date) throw new Error('Date is required for oneTime jobs');
                return new OneTimeJob(config.client, config.phoneNumber, config.message, config.date);
            case 'recurring':
                if (!config.cronExpression) throw new Error('Cron expression is required for recurring jobs');
                return new RecurringJob(config.client, config.phoneNumber, config.message, config.cronExpression);
            default:
                throw new Error('Tipo de job no válido');
        }
    }
}

// Scheduler para manejar los jobs
class JobScheduler {
    private jobs: Map<string, JobData>;

    constructor() {
        this.jobs = new Map();
    }

    scheduleJob(jobId: string, job: BaseJob): string {
        const task = cron.schedule(job.getCronExpression(), () => {
            job.execute();
        }, {
            scheduled: true,
            timezone: "America/Bogota"
        });

        this.jobs.set(jobId, {
            job,
            task
        });

        return jobId;
    }

    stopJob(jobId: string): boolean {
        const jobData = this.jobs.get(jobId);
        if (jobData) {
            jobData.task.stop();
            this.jobs.delete(jobId);
            return true;
        }
        return false;
    }

    getJob(jobId: string): JobData | undefined {
        return this.jobs.get(jobId);
    }

    getAllJobs(): [string, JobData][] {
        return Array.from(this.jobs.entries());
    }
}

// Clase para manejar los jobs
class JobManager {
    private scheduler: JobScheduler;

    constructor() {
        this.scheduler = new JobScheduler();
    }

    createAndScheduleJob(type: 'oneTime' | 'recurring', config: JobConfig, jobId: string): void {
        try {
            const job = JobFactory.createJob(type, config);
            this.scheduler.scheduleJob(jobId, job);
            console.log(`Job ${jobId} programado exitosamente`);
        } catch (error) {
            console.error('Error al programar job:', error);
        }
    }

    stopSpecificJob(jobId: string): void {
        const stopped = this.scheduler.stopJob(jobId);
        console.log(stopped ? `Job ${jobId} detenido` : `Job ${jobId} no encontrado`);
    }

    getJobInfo(jobId: string): void {
        const jobData = this.scheduler.getJob(jobId);
        console.log(jobData ? jobData : `Job ${jobId} no encontrado`);
    }

    listAllJobs(): void {
        const jobs = this.scheduler.getAllJobs();
        console.log('Jobs activos:', jobs);
    }
}

// Ejemplo de uso
const initializeJobs = (client: Client): JobManager => {
    const jobManager = new JobManager();

    // Configuración de mensajes únicos
    const oneTimeConfig: JobConfig = {
        client,
        phoneNumber: "573046282936",
        message: "Este es un mensaje único programado de prueba",
        date: new Date().setMinutes(new Date().getMinutes() + 5).toLocaleString()
    };
    jobManager.createAndScheduleJob('oneTime', oneTimeConfig, 'mensaje-unico-1');

    // Configuración de mensajes diarios
    const dailyConfigMio: JobConfig = {
        client,
        phoneNumber: "573046282936",
        message: "Este es un mensaje de preuba programado cada 5 minutos",
        cronExpression: '*/5 * * * *' // Cada 5 minutos
    };
    jobManager.createAndScheduleJob('recurring', dailyConfigMio, 'mensaje-diario-mio');
    // Configuración de mensajes diarios
    const dailyConfigMorita: JobConfig = {
        client,
        phoneNumber: "573208471126",
        message: "Hola morita, menos dias momor, como amaneciste?",
        cronExpression: '30 6 * * *' // Cada día a las 6:30am
    };
    jobManager.createAndScheduleJob('recurring', dailyConfigMorita, 'mensaje-diario-morita');


    return jobManager;
};

export {
    JobFactory,
    JobScheduler,
    JobManager,
    initializeJobs,
    type JobConfig,
    type JobData
};