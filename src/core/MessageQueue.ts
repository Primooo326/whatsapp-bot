/**
 * Cola de mensajes serializada para evitar sobrecarga de Chromium/Puppeteer.
 * - Solo un mensaje se envía a la vez, con pausa configurable entre envíos.
 * - `add()`: encola y espera el resultado (await).
 * - `enqueue()`: fire-and-forget, retorna false si la cola está llena.
 */
export class MessageQueue {
    private queue: Array<{
        task: () => Promise<any>;
        resolve: (value: any) => void;
        reject: (error: any) => void;
    }> = [];
    private processing = false;
    private delayMs: number;
    private maxSize: number;

    constructor(delayMs = 3000, maxSize = 500) {
        this.delayMs = delayMs;
        this.maxSize = maxSize;
    }

    /** Encola una tarea y espera su resultado. Lanza error si la cola está llena. */
    async add<T>(task: () => Promise<T>): Promise<T> {
        if (this.queue.length >= this.maxSize) {
            throw new Error(`Cola llena (${this.maxSize} items). Reintenta más tarde.`);
        }
        return new Promise<T>((resolve, reject) => {
            this.queue.push({ task, resolve, reject });
            this.processNext();
        });
    }

    /** Fire-and-forget: encola sin esperar. Retorna false si la cola está llena. */
    enqueue(task: () => Promise<any>): boolean {
        if (this.queue.length >= this.maxSize) return false;
        this.queue.push({
            task,
            resolve: () => { },
            reject: (err) => console.error('[MessageQueue] Error en tarea:', err),
        });
        this.processNext();
        return true;
    }

    private async processNext(): Promise<void> {
        if (this.processing || this.queue.length === 0) return;
        this.processing = true;

        const item = this.queue.shift()!;

        try {
            const result = await item.task();
            item.resolve(result);
        } catch (error) {
            item.reject(error);
        }

        await new Promise(r => setTimeout(r, this.delayMs));

        this.processing = false;
        this.processNext();
    }

    /** Tareas pendientes en cola (sin contar la que está en proceso). */
    get pending(): number {
        return this.queue.length;
    }

    /** Total de tareas en cola + la que se está procesando actualmente. */
    get size(): number {
        return this.queue.length + (this.processing ? 1 : 0);
    }

    /** Tiempo estimado hasta procesar todo (segundos). */
    get estimatedWaitSec(): number {
        return Math.round(this.size * this.delayMs / 1000);
    }

    get isProcessing(): boolean {
        return this.processing;
    }

    get isFull(): boolean {
        return this.queue.length >= this.maxSize;
    }
}
