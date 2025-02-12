import cron from 'node-cron';
import { Client, Chat } from 'whatsapp-web.js';
import moment from 'moment-timezone';
import { romeo } from './api/ollama.api';

// Interfaces
interface JobConfig {
    client: Client;
    phoneNumbers: string[];  // Ahora es un array de números
    message: string | (() => Promise<string>);
    date?: string;
    cronExpression?: string;
}

interface JobData {
    job: BaseJob;
    task: cron.ScheduledTask;
}

// Clase base para los jobs
abstract class BaseJob {
    protected phoneNumbers: string[];  // Ahora es un array
    protected message: string | (() => Promise<string>);
    protected client: Client;
    protected readonly TARGET_TIMEZONE = "America/Bogota";
    protected active: boolean = true;


    protected convertToTargetTimezone(date: Date): moment.Moment {
        return moment(date).tz(this.TARGET_TIMEZONE);
    }

    constructor(client: Client, phoneNumbers: string[], message: string | (() => Promise<string>)) {
        this.client = client;
        this.phoneNumbers = this.validatePhoneNumbers(phoneNumbers);
        this.message = message;
    }

    private validatePhoneNumbers(phones: string[]): string[] {
        return phones.map(phone => {
            const cleanPhone = phone.replace(/\D/g, '');
            // Validación más flexible que acepta números de cualquier país
            if (!/^\d{10,15}$/.test(cleanPhone)) {
                throw new Error(`Número inválido: ${phone}. Debe tener entre 10 y 15 dígitos.`);
            }
            return cleanPhone;
        });
    }

    private async getMessageContent(): Promise<string> {
        if (typeof this.message === 'function') {
            return await this.message();
        }
        return this.message;
    }

    async execute(): Promise<void> {
        try {
            const messageContent = await this.getMessageContent();

            // Enviar mensaje a todos los números en el array
            for (const phoneNumber of this.phoneNumbers) {
                try {
                    const chatId = phoneNumber + "@c.us";
                    const chat: Chat = await this.client.getChatById(chatId);
                    await chat.sendMessage(messageContent);
                    console.log(`[${moment().tz(this.TARGET_TIMEZONE).format()}] Mensaje enviado a ${phoneNumber}: ${messageContent}`);
                } catch (error) {
                    console.error(`Error al enviar mensaje a ${phoneNumber}:`, error);
                }
            }
        } catch (error) {
            console.error(`[${moment().tz(this.TARGET_TIMEZONE).format()}] Error al ejecutar job:`, error);
        }
    }

    abstract getCronExpression(): string;

    isActive(): boolean {
        return this.active;
    }

    setActive(status: boolean): void {
        this.active = status;
    }

    get getJobInfo(): {
        phoneNumbers: string[];
        message: string | (() => Promise<string>);
        timezone: string;
        currentTime: string;
        date?: string;           // Para OneTimeJob
        cronExpression?: string; // Para RecurringJob
        active: boolean;         // Nuevo campo
    } {
        return {
            phoneNumbers: this.phoneNumbers,
            message: this.message,
            timezone: this.TARGET_TIMEZONE,
            currentTime: moment().tz(this.TARGET_TIMEZONE).format(),
            active: this.active
        };
    }
}

// Job para mensajes únicos
class OneTimeJob extends BaseJob {
    private date: moment.Moment;

    constructor(client: Client, phoneNumbers: string[], message: string | (() => Promise<string>), date: string) {
        super(client, phoneNumbers, message);
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

    get getJobInfo() {
        return {
            ...super.getJobInfo,
            date: this.date.format(),  // Solo incluimos la fecha para OneTimeJob
            type: 'oneTime' as const
        };
    }
}

class RecurringJob extends BaseJob {
    private cronExpression: string;

    constructor(client: Client, phoneNumbers: string[], message: string | (() => Promise<string>), cronExpression: string) {
        super(client, phoneNumbers, message);

        if (!cron.validate(cronExpression)) {
            throw new Error('Expresión cron inválida');
        }

        this.cronExpression = cronExpression;
    }

    getCronExpression(): string {
        return this.cronExpression;
    }

    get getJobInfo() {
        return {
            ...super.getJobInfo,
            cronExpression: this.cronExpression,  // Solo incluimos cronExpression para RecurringJob
            type: 'recurring' as const
        };
    }
}

// Factory para crear jobs
class JobFactory {
    static createJob(type: 'oneTime' | 'recurring', config: JobConfig): BaseJob {
        try {
            switch (type) {
                case 'oneTime':
                    if (!config.date) {
                        throw new Error('Se requiere fecha para trabajos únicos');
                    }
                    if (!config.phoneNumbers || config.phoneNumbers.length === 0) {
                        throw new Error('Se requiere al menos un número de teléfono');
                    }
                    return new OneTimeJob(
                        config.client,
                        config.phoneNumbers,
                        config.message,
                        config.date
                    );

                case 'recurring':
                    if (!config.cronExpression) {
                        throw new Error('Se requiere expresión cron para trabajos recurrentes');
                    }
                    if (!config.phoneNumbers || config.phoneNumbers.length === 0) {
                        throw new Error('Se requiere al menos un número de teléfono');
                    }
                    return new RecurringJob(
                        config.client,
                        config.phoneNumbers,
                        config.message,
                        config.cronExpression
                    );

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
    readonly TARGET_TIMEZONE = "America/Bogota";

    constructor() {
        this.jobs = new Map();
    }

    scheduleJob(jobId: string, job: BaseJob): string {
        try {
            const cronExpression = job.getCronExpression();

            const task = cron.schedule(cronExpression, async () => {
                const jobData = this.jobs.get(jobId);
                if (jobData && jobData.job.isActive()) {
                    console.log(`[${moment().tz(this.TARGET_TIMEZONE).format()}] Ejecutando trabajo ${jobId}`);
                    await job.execute();
                } else {
                    console.log(`[${moment().tz(this.TARGET_TIMEZONE).format()}] Job ${jobId} está inactivo, saltando ejecución`);
                }
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
            jobData.job.setActive(false);
            console.log(`Job ${jobId} detenido a las ${moment().tz(this.TARGET_TIMEZONE).format()}`);
            return true;
        }
        return false;
    }

    startJob(jobId: string): boolean {
        const jobData = this.jobs.get(jobId);
        if (jobData) {
            jobData.job.setActive(true);
            jobData.task.start();
            console.log(`Job ${jobId} iniciado a las ${moment().tz(this.TARGET_TIMEZONE).format()}`);
            return true;
        }
        return false;
    }

    deleteJob(jobId: string): boolean {
        const jobData = this.jobs.get(jobId);
        if (jobData) {
            // Detener la tarea programada
            jobData.task.stop();
            // Eliminar todas las referencias al job
            this.jobs.delete(jobId);
            console.log(`Job ${jobId} eliminado a las ${moment().tz(this.TARGET_TIMEZONE).format()}`);
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
    TARGET_TIMEZONE
    constructor() {
        this.scheduler = new JobScheduler();
        this.TARGET_TIMEZONE = this.scheduler.TARGET_TIMEZONE;
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

    stopSpecificJob(jobId: string): string {
        const stopped = this.scheduler.stopJob(jobId);
        if (!stopped) {
            return `❌ Job ${jobId} no encontrado`;
        } else {
            return `⏸️ Job ${jobId} detenido a las ${moment().tz(this.TARGET_TIMEZONE).format()}`;
        }
    }

    startSpecificJob(jobId: string): string {
        const started = this.scheduler.startJob(jobId);
        if (!started) {
            return `❌ Job ${jobId} no encontrado`;
        } else {
            return `▶️ Job ${jobId} iniciado a las ${moment().tz(this.TARGET_TIMEZONE).format()}`;
        }
    }

    // Nuevo método para eliminar jobs
    deleteSpecificJob(jobId: string): string {
        const deleted = this.scheduler.deleteJob(jobId);
        if (!deleted) {
            return `❌ Job ${jobId} no encontrado`;
        } else {
            return `🗑️ Job ${jobId} eliminado a las ${moment().tz(this.TARGET_TIMEZONE).format()}`;
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
        phoneNumbers: ["573046282936"],
        message: async () => {
            const romeoMsg = await romeo();
            return `Mensaje de verificación de Jobs y Ollama:: ${romeoMsg}`;
        },
        date: moment().add(1, 'minutes').format()
    };
    jobManager.createAndScheduleJob('oneTime', oneTimeConfig, 'mensaje-unico-1');

    // Configuración de mensajes cada cierto tiempo
    const dailyConfigMio: JobConfig = {
        client,
        phoneNumbers: ["573046282936"],
        message: async () => await romeo(),
        cronExpression: '0 */5 * * * *' // Cada 5 minutos 
    };
    jobManager.createAndScheduleJob('recurring', dailyConfigMio, 'mensaje-diario-mio');
    // Configuración de mensajes diarios
    const dailyConfigMorita: JobConfig = {
        client,
        phoneNumbers: ["573208471126"],
        message: "Hola morita, menos dias momor, como amaneciste?",
        cronExpression: '30 6 * * *' // Cada día a las 6:30am
    };
    jobManager.createAndScheduleJob('recurring', dailyConfigMorita, 'mensaje-diario-morita');


    return jobManager;
};
