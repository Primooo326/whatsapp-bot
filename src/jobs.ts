import cron from 'node-cron';
import { Client, Chat } from 'whatsapp-web.js';
import moment from 'moment-timezone';

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
    protected readonly TARGET_TIMEZONE = "America/Bogota";

    protected convertToTargetTimezone(date: Date): moment.Moment {
        return moment(date).tz(this.TARGET_TIMEZONE);
    }

    constructor(client: Client, phoneNumber: string, message: string) {
        this.client = client;
        this.phoneNumber = this.validatePhoneNumber(phoneNumber);
        this.message = message;
    }

    private validatePhoneNumber(phone: string): string {
        const cleanPhone = phone.replace(/\D/g, '');
        if (!/^57\d{10}$/.test(cleanPhone)) {
            throw new Error('Número de teléfono inválido. Debe ser un número colombiano válido.');
        }
        return cleanPhone;
    }

    async execute(): Promise<void> {
        try {
            const chatId = this.phoneNumber + "@c.us";
            const chat: Chat = await this.client.getChatById(chatId);
            await chat.sendMessage(this.message);
            console.log(`[${moment().tz(this.TARGET_TIMEZONE).format()}] Mensaje enviado a ${this.phoneNumber}: ${this.message}`);
        } catch (error) {
            console.error(`[${moment().tz(this.TARGET_TIMEZONE).format()}] Error al ejecutar job:`, error);
        }
    }

    abstract getCronExpression(): string;
}

// Job para mensajes únicos
class OneTimeJob extends BaseJob {
    private date: moment.Moment;

    constructor(client: Client, phoneNumber: string, message: string, date: string) {
        super(client, phoneNumber, message);
        this.date = moment.tz(date, this.TARGET_TIMEZONE);

        if (!this.date.isValid()) {
            throw new Error('Fecha inválida');
        }

        if (this.date.isBefore(moment())) {
            throw new Error('La fecha debe ser futura');
        }
    }

    getCronExpression(): string {
        return `${this.date.minutes()} ${this.date.hours()} ${this.date.date()} ${this.date.month() + 1} *`;
    }
}

// Job para mensajes recurrentes
class RecurringJob extends BaseJob {
    private cronExpression: string;

    constructor(client: Client, phoneNumber: string, message: string, cronExpression: string) {
        super(client, phoneNumber, message);

        if (!cron.validate(cronExpression)) {
            throw new Error('Expresión cron inválida');
        }

        this.cronExpression = cronExpression;
    }

    getCronExpression(): string {
        return this.cronExpression;
    }
}

// Factory para crear jobs
class JobFactory {
    static createJob(type: 'oneTime' | 'recurring', config: JobConfig): BaseJob {
        try {
            switch (type) {
                case 'oneTime':
                    if (!config.date) throw new Error('Se requiere fecha para trabajos únicos');
                    return new OneTimeJob(config.client, config.phoneNumber, config.message, config.date);
                case 'recurring':
                    if (!config.cronExpression) throw new Error('Se requiere expresión cron para trabajos recurrentes');
                    return new RecurringJob(config.client, config.phoneNumber, config.message, config.cronExpression);
                default:
                    throw new Error('Tipo de job no válido');
            }
        } catch (error) {
            console.error('Error al crear job:', error);
            throw error;
        }
    }
}

// Scheduler para manejar los jobs
class JobScheduler {
    private jobs: Map<string, JobData>;
    private readonly TARGET_TIMEZONE = "America/Bogota";

    constructor() {
        this.jobs = new Map();
    }

    scheduleJob(jobId: string, job: BaseJob): string {
        try {
            const cronExpression = job.getCronExpression();
            console.log({
                jobId,
                cronExpression,
                serverTime: new Date().toISOString(),
                bogotaTime: moment().tz(this.TARGET_TIMEZONE).format(),
                serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            });

            const task = cron.schedule(cronExpression, () => {
                console.log(`[${moment().tz(this.TARGET_TIMEZONE).format()}] Ejecutando trabajo ${jobId}`);
                job.execute();
            }, {
                scheduled: true,
                timezone: this.TARGET_TIMEZONE
            });

            this.jobs.set(jobId, { job, task });
            return jobId;
        } catch (error) {
            console.error(`Error al programar job ${jobId}:`, error);
            throw error;
        }
    }

    stopJob(jobId: string): boolean {
        const jobData = this.jobs.get(jobId);
        if (jobData) {
            jobData.task.stop();
            this.jobs.delete(jobId);
            console.log(`Job ${jobId} detenido a las ${moment().tz(this.TARGET_TIMEZONE).format()}`);
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
            throw error;
        }
    }

    stopSpecificJob(jobId: string): void {
        const stopped = this.scheduler.stopJob(jobId);
        if (!stopped) {
            console.log(`Job ${jobId} no encontrado`);
        }
    }

    getJobInfo(jobId: string): JobData | undefined {
        return this.scheduler.getJob(jobId);
    }

    listAllJobs(): [string, JobData][] {
        return this.scheduler.getAllJobs();
    }
}

export {
    JobManager,
    JobConfig,
    JobData,
    initializeJobs,

};
// Ejemplo de uso
const initializeJobs = (client: Client): JobManager => {
    const jobManager = new JobManager();

    // Configuración de mensajes únicos
    const oneTimeConfig: JobConfig = {
        client,
        phoneNumber: "573046282936",
        message: "Este es un mensaje único programado de prueba",
        date: moment().add(5, 'minutes').format()
    };
    jobManager.createAndScheduleJob('oneTime', oneTimeConfig, 'mensaje-unico-1');

    // Configuración de mensajes diarios
    const dailyConfigMio: JobConfig = {
        client,
        phoneNumber: "573046282936",
        message: "Este es un mensaje de preuba programado cada 5 minutos",
        cronExpression: '0 */5 * * * *' // Cada 5 minutos 
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
