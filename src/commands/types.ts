// src/commands/types.ts
import { Client, MessageContent } from 'whatsapp-web.js';
import { JobManager } from '../jobs';

// src/commands/types.ts
export interface Command {
    command: string;
    description: string;
    handler: (id: string, args: string | undefined, context: CommandContext) => Promise<void>;
}

export interface CommandContext {
    client: Client;
    jobManager: JobManager;
    sendMessage: (id: string, message: MessageContent) => Promise<void>;
    commands: Command[];  // Añadimos esta propiedad
}