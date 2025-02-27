// src/commands/utilityCommands.ts
import { Command, CommandContext } from './types';
import { qwen2 } from '../api/ollama.api';
import { generarPDFConImagen, validarHora } from '@/tools/utils';
import { MessageMedia } from 'whatsapp-web.js';

export const createUtilityCommands = (getCommands: () => Command[]): Command[] => {
    return [
        {
            command: '!help',
            description: '*Lista de comandos*',
            handler: async (id: string, _, context: CommandContext) => {
                let message = '📚 *COMANDOS DISPONIBLES*\n\n';
                getCommands().forEach((command) => {
                    // Extraer el título principal (texto entre asteriscos)
                    const titleMatch = command.description.match(/\*(.*?)\*/);
                    const title = titleMatch ? titleMatch[1] : command.description;

                    // Extraer la descripción adicional si existe (después de ::)
                    const [_, ...details] = command.description.split('::');
                    const additionalInfo = details.join('::').trim();

                    message += `🔹 *${command.command}*\n`;
                    message += `├─ *${title}*\n`;

                    if (additionalInfo) {
                        message += `└─ _Uso:_ ${additionalInfo}\n \f`;
                    } else {
                        message += `\n`;
                    }
                });

                message += '\n💡 _Envía cualquier comando para comenzar_';
                context.sendMessage(id, message);
            }
        },
        {
            command: '!ping',
            description: '*Test de conexión*',
            handler: async (id: string, _, context: CommandContext) => {
                context.sendMessage(id, 'pong 🏓');
            }
        },
        {
            command: '!qwen',
            description: '*Modelo Qwen AI*:: !qwen <texto>\n_Genera respuestas usando el modelo Qwen_',
            handler: async (id: string, prompt: string | undefined, context: CommandContext) => {
                if (prompt) {
                    context.sendMessage(id, '⏳ Generando respuesta...');
                    const response = await qwen2(prompt);
                    context.sendMessage(id, response);
                } else {
                    context.sendMessage(id, '❌ *Error:* Por favor, escribe un texto después del comando.\n\n' +
                        '📝 *Ejemplo:*\n' +
                        '!qwen Escribe un poema sobre el amor');
                }
            }
        },
        {
            command: "!excusa",
            description: "*Genera excusa en formato pdf*:: !excusa <fecha de expiración> <fecha de culminación> <hora de culminación>",
            handler: async (id: string, args: string | undefined, context: CommandContext) => {
                if (!args) {
                    context.sendMessage(id, "Formato: !excusa 28/02/2021 28/02/2021 10:00AM");
                    return
                }
                const [fechaExp, fechaExcusa, horaCulminada] = args.split(" ");

                if (!validarHora(horaCulminada)) {
                    context.sendMessage(id, "Formato de hora inválido. Debe ser 10:00AM o 10:00PM");
                    return
                }

                const url = await generarPDFConImagen(fechaExp, fechaExcusa, horaCulminada);
                const pdfMedia = MessageMedia.fromFilePath(url);
                await context.sendMessage(id, pdfMedia);

            },
        }
    ];
};