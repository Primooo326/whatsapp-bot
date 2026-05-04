/**
 * Cola de mensajes serializada para evitar sobrecarga de Chromium/Puppeteer.
 * Garantiza que solo un mensaje se envíe a la vez, con pausas configurables entre envíos.
 */
export class MessageQueue {
    private queue: Array<{
        task: () => Promise<any>;
        resolve: (value: any) => void;
        reject: (error: any) => void;
    }> = [];
    private processing = false;
    private delayMs: number;

    constructor(delayMs = 3000) {
        this.delayMs = delayMs;
    }

    /**
     * Agrega una tarea a la cola y espera su resultado.
     * Las tareas se ejecutan secuencialmente, nunca en paralelo.
     */
    async add<T>(task: () => Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this.queue.push({ task, resolve, reject });
            this.processNext();
        });
    }

    /**
     * Procesa la siguiente tarea en la cola.
     * Si ya se está procesando una tarea, no hace nada (se llamará de nuevo al terminar).
     */
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

        // Pausa entre mensajes para no saturar Chromium
        await new Promise(r => setTimeout(r, this.delayMs));

        this.processing = false;
        this.processNext();
    }

    /**
     * Retorna el número de tareas pendientes en la cola.
     */
    get pending(): number {
        return this.queue.length;
    }

    /**
     * Retorna si la cola está procesando una tarea.
     */
    get isProcessing(): boolean {
        return this.processing;
    }
}
