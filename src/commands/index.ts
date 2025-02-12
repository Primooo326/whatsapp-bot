// src/commands/index.ts
import { Client } from 'whatsapp-web.js';
import { JobManager } from '../jobs';
import { Command, CommandContext } from './types';
import { createJobCommands } from './jobCommands';
import { createUtilityCommands } from './utilityCommands';

export class CommandHandler {
    private commands: Command[] = [];
    private currentCommand: string = '';
    private context: CommandContext;

    constructor(client: Client, jobManager: JobManager) {
        this.context = {
            client,
            jobManager,
            sendMessage: this.sendMessage.bind(this),
            commands: []
        };

        // Creamos una función que devuelve la lista de comandos
        const getCommands = () => this.commands;

        // Inicializamos los comandos
        this.commands = [
            ...createJobCommands(this.context),
            ...createUtilityCommands(getCommands)
        ];

        // Actualizamos la lista de comandos en el contexto
        this.context.commands = this.commands;
    }

    private async sendMessage(id: string, message: string) {
        await this.context.client.sendMessage(id, message);
    }

    public async handleCommand(id: string, message: string) {
        try {
            if (message.trim().startsWith('!')) {
                const command = message.trim().split(' ')[0];
                const args = message.trim().split(' ').slice(1).join(' ');

                const commandFound = this.commands.find(cm => cm.command === command);
                if (commandFound) {
                    await commandFound.handler(id, args, this.context);
                    this.currentCommand = command;
                } else {
                    await this.sendMessage(id, `Comando no encontrado: ${command}`);
                }
            } else {
                if (this.currentCommand) {
                    const commandFound = this.commands.find(cm => cm.command === this.currentCommand);
                    if (commandFound) {
                        await commandFound.handler(id, message, this.context);
                    }
                }
            }
        } catch (error) {
            console.error('Error al procesar el comando:', error);
            await this.sendMessage(id, 'Error al procesar el comando');
        }
    }
}

export { Command, CommandContext };