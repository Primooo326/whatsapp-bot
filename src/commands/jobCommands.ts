// src/commands/jobCommands.ts
import moment from 'moment';
import { Command, CommandContext } from './types';
import { JobConfig } from '../jobs';
import cron from 'node-cron';
export const createJobCommands = (context: CommandContext): Command[] => {
    return [
        {
            command: '!jobs',
            description: '*Lista de trabajos programados*',
            handler: async (id: string, _: string | undefined) => {
                const jobs = context.jobManager.listAllJobs();

                if (jobs.length === 0) {
                    context.sendMessage(id, '📋 *No hay trabajos programados actualmente*');
                    return;
                }

                let message = '📋 *Lista de Trabajos Programados*\n\n';

                jobs.forEach(([jobId, jobData]) => {
                    const jobInfo = jobData.job.getJobInfo;
                    const isRecurring = 'cronExpression' in jobInfo;

                    message += `🔹 *ID:* ${jobId}\n`;
                    message += `├─ *Tipo:* ${isRecurring ? '🔄 Recurrente' : '⏰ Una vez'}\n`;

                    if (isRecurring) {
                        message += `├─ *Expresión Cron:* ${jobInfo.cronExpression}\n`;
                    } else {
                        const date = moment(jobInfo.date).format('DD/MM/YYYY HH:mm:ss');
                        const timeLeft = moment(jobInfo.date).fromNow();
                        message += `├─ *Fecha:* ${date} (${timeLeft})\n`;
                    }

                    message += `├─ *Estado:* ${jobData.job.isActive() ? '✅ Activo' : '⏸️ Pausado'}\n`;
                    message += `├─ *Mensaje:* "${jobInfo.message}"\n`;

                    // Formatear números de teléfono
                    const phones = jobInfo.phoneNumbers.map(phone => {
                        return phone.replace(/(\d{2})(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4');
                    });

                    if (phones.length === 1) {
                        message += `└─ *Número:* ${phones[0]}\n`;
                    } else {
                        message += `├─ *Números:*\n`;
                        phones.forEach((phone, index) => {
                            const isLast = index === phones.length - 1;
                            message += `${isLast ? '└' : '├'}── ${phone}\n`;
                        });
                    }

                    message += '\n';
                });

                // Agregar resumen al final
                const activeJobs = jobs.filter(([_, jobData]) => jobData.job.isActive()).length;
                const pausedJobs = jobs.length - activeJobs;

                message += `📊 *Resumen:*\n`;
                message += `├─ Total de trabajos: ${jobs.length}\n`;
                message += `├─ Trabajos activos: ${activeJobs}\n`;
                message += `└─ Trabajos pausados: ${pausedJobs}\n`;

                context.sendMessage(id, message);
            }
        },
        {
            command: '!stopJob',
            description: '*Detener un trabajo*:: !stopJob <jobId>',
            handler: async (id: string, jobId: string | undefined, context: CommandContext) => {
                if (!jobId) {
                    context.sendMessage(id, '❌ Debes especificar el ID del trabajo');
                    return;
                }
                const result = context.jobManager.stopSpecificJob(jobId);
                context.sendMessage(id, result);
            }
        },
        {
            command: '!startJob',
            description: '*Iniciar un trabajo detenido*:: !startJob <jobId>',
            handler: async (id: string, jobId: string | undefined, context: CommandContext) => {
                if (!jobId) {
                    context.sendMessage(id, '❌ Debes especificar el ID del trabajo');
                    return;
                }
                const result = context.jobManager.startSpecificJob(jobId);
                context.sendMessage(id, result);
            }
        },
        {
            command: '!deleteJob',
            description: '*Eliminar un trabajo*:: !deleteJob <jobId>',
            handler: async (id: string, jobId: string | undefined, context: CommandContext) => {
                if (!jobId) {
                    context.sendMessage(id, '❌ Debes especificar el ID del trabajo');
                    return;
                }
                const result = context.jobManager.deleteSpecificJob(jobId);
                context.sendMessage(id, result);
            }
        },
        {
            command: '!createOneTime',
            description: '*Crear trabajo de una vez*:: !createOneTime <jobId> <phoneNumbers> <dd/mm/yyyy hh:mm:ss (24h)> "message"',
            handler: async (id: string, args: string | undefined) => {
                if (!args) {
                    context.sendMessage(id, 'Formato: !createOneTime jobId phone1,phone2 dd/mm/yyyy hh:mm:ss "mensaje"\n' +
                        'Ejemplo: !createOneTime prueba-job 573003709040,573046282936 25/12/2024 15:30:00 "hola como estas"');
                    return;
                }

                try {
                    // Extraer mensaje (entre comillas)
                    const messageMatch = args.match(/"(.*?)"/);
                    if (!messageMatch) {
                        context.sendMessage(id, 'El mensaje debe estar entre comillas dobles. Ejemplo: "hola como estas"');
                        return;
                    }
                    const message = messageMatch[1];

                    // Extraer el resto de los argumentos (antes del mensaje)
                    const beforeMessage = args.split('"')[0].trim();
                    const [jobId, phones, ...dateTimeParts] = beforeMessage.split(' ');
                    const dateTimeStr = dateTimeParts.join(' ');

                    if (!jobId || !phones || !dateTimeStr || !message) {
                        context.sendMessage(id, 'Faltan argumentos. Formato: !createOneTime jobId phone1,phone2 dd/mm/yyyy hh:mm:ss "mensaje"\n' +
                            'Ejemplo: !createOneTime prueba-job 573003709040,573046282936 25/12/2024 15:30:00 "hola como estas"');
                        return;
                    }

                    const phoneNumbers = phones.split(',');

                    // Validar números de teléfono
                    const phoneRegex = /^[0-9]{10,15}$/;
                    const invalidPhones = phoneNumbers.filter(phone => !phoneRegex.test(phone));
                    if (invalidPhones.length > 0) {
                        context.sendMessage(id, `Los siguientes números de teléfono son inválidos: ${invalidPhones.join(', ')}`);
                        return;
                    }

                    // Validar y parsear la fecha
                    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/;
                    const dateMatch = dateTimeStr.match(dateRegex);
                    if (!dateMatch) {
                        context.sendMessage(id, 'Formato de fecha inválido. Debe ser dd/mm/yyyy hh:mm:ss');
                        return;
                    }

                    const [_, day, month, year, hour, minute, second] = dateMatch;
                    const scheduledDate = moment(`${year}-${month}-${day} ${hour}:${minute}:${second}`, 'YYYY-MM-DD HH:mm:ss');

                    // Validar que la fecha no sea en el pasado
                    if (scheduledDate.isBefore(moment())) {
                        context.sendMessage(id, 'La fecha programada no puede ser en el pasado');
                        return;
                    }

                    const config: JobConfig = {
                        client: context.client,
                        phoneNumbers,
                        message,
                        date: scheduledDate.format()
                    };

                    context.jobManager.createAndScheduleJob('oneTime', config, jobId);
                    context.sendMessage(id, `✅ Trabajo único creado exitosamente:\n\n` +
                        `📋 ID: ${jobId}\n` +
                        `⏰ Fecha programada: ${scheduledDate.format('DD/MM/YYYY HH:mm:ss')}\n` +
                        `💬 Mensaje: ${message}\n` +
                        `📱 Números: ${phoneNumbers.join(', ')}`);

                } catch (error: any) {
                    context.sendMessage(id, `❌ Error al crear el trabajo: ${error.message}`);
                }
            }
        },
        {
            command: '!createRecurring',
            description: '*Crear trabajo recurrente*:: !createRecurring <jobId> <phoneNumbers> [cronExpression] "message"',
            handler: async (id: string, args: string | undefined) => {
                if (!args) {
                    context.sendMessage(id, 'Formato: !createRecurring jobId phone1,phone2 [cronExpression] "mensaje"\n' +
                        'Ejemplo: !createRecurring prueba-job 573003709040,573046282936 [*/5 * * * *] "hola como estas"');
                    return;
                }

                try {
                    // Extraer cronExpression (entre corchetes)
                    const cronMatch = args.match(/\[(.*?)\]/);
                    if (!cronMatch) {
                        context.sendMessage(id, 'La expresión cron debe estar entre corchetes []. Ejemplo: [*/5 * * * *]');
                        return;
                    }
                    const cronExp = cronMatch[1];

                    // Extraer mensaje (entre comillas)
                    const messageMatch = args.match(/"(.*?)"/);
                    if (!messageMatch) {
                        context.sendMessage(id, 'El mensaje debe estar entre comillas dobles. Ejemplo: "hola como estas"');
                        return;
                    }
                    const message = messageMatch[1];

                    // Extraer jobId y phones (están antes del cronExp)
                    const beforeCron = args.split('[')[0].trim();
                    const [jobId, phones] = beforeCron.split(' ');

                    if (!jobId || !phones || !cronExp || !message) {
                        context.sendMessage(id, 'Faltan argumentos. Formato: !createRecurring jobId phone1,phone2 [cronExpression] "mensaje"\n' +
                            'Ejemplo: !createRecurring prueba-job 573003709040,573046282936 [*/5 * * * *] "hola como estas"');
                        return;
                    }

                    const phoneNumbers = phones.split(',');

                    if (!cron.validate(cronExp)) {
                        context.sendMessage(id, 'Expresión cron inválida. Usa !cronHelp para ver ejemplos válidos.');
                        return;
                    }

                    // Validar números de teléfono
                    const phoneRegex = /^[0-9]{10,15}$/;
                    const invalidPhones = phoneNumbers.filter(phone => !phoneRegex.test(phone));
                    if (invalidPhones.length > 0) {
                        context.sendMessage(id, `Los siguientes números de teléfono son inválidos: ${invalidPhones.join(', ')}`);
                        return;
                    }

                    const config: JobConfig = {
                        client: context.client,
                        phoneNumbers,
                        message,
                        cronExpression: cronExp
                    };

                    context.jobManager.createAndScheduleJob('recurring', config, jobId);
                    context.sendMessage(id, `✅ Trabajo recurrente creado exitosamente:\n\n` +
                        `📋 ID: ${jobId}\n` +
                        `⏰ Cron: ${cronExp}\n` +
                        `💬 Mensaje: ${message}\n` +
                        `📱 Números: ${phoneNumbers.join(', ')}`);

                } catch (error: any) {
                    context.sendMessage(id, `❌ Error al crear el trabajo: ${error.message}`);
                }
            }
        },
        {
            command: '!jobInfo',
            description: '*Ver información de un trabajo*:: !jobInfo <jobId>',
            handler: async (id: string, jobId: string | undefined) => {
                if (!jobId) {
                    context.sendMessage(id, 'Debes especificar el ID del trabajo');
                    return;
                }
                const jobInfo = context.jobManager.getJobInfo(jobId);
                if (jobInfo) {
                    context.sendMessage(id, `Información del trabajo ${jobId}:\n${JSON.stringify(jobInfo.job.getJobInfo, null, 2)}`);
                } else {
                    context.sendMessage(id, `No se encontró el trabajo ${jobId}`);
                }
            }
        },
        {
            command: '!cronHelp',
            description: '*Guía de expresiones cron*:: Aprende a programar mensajes recurrentes',
            handler: async (id: string, _: string | undefined) => {
                const helpMessage = `⏰ *GUÍA DE EXPRESIONES CRON*\n\n` +
                    `📝 *Formato General:*\n` +
                    `\`\`\`minuto hora díaMes mes díaSemana\`\`\`\n\n` +

                    `🔹 *Componentes:*\n` +
                    `├─ Minuto: 0-59\n` +
                    `├─ Hora: 0-23\n` +
                    `├─ Día del mes: 1-31\n` +
                    `├─ Mes: 1-12\n` +
                    `└─ Día de semana: 0-6 (0=domingo)\n\n` +

                    `📋 *Ejemplos Comunes:*\n` +
                    `├─ *Cada minuto:*\n` +
                    `│  \`*/1 * * * *\`\n` +
                    `│\n` +
                    `├─ *Cada 5 minutos:*\n` +
                    `│  \`*/5 * * * *\`\n` +
                    `│\n` +
                    `├─ *Cada hora en punto:*\n` +
                    `│  \`0 * * * *\`\n` +
                    `│\n` +
                    `├─ *Todos los días 8:00 AM:*\n` +
                    `│  \`0 8 * * *\`\n` +
                    `│\n` +
                    `├─ *Lunes a las 9:00 AM:*\n` +
                    `│  \`0 9 * * 1\`\n` +
                    `│\n` +
                    `└─ *Día 1 de cada mes 12:00 PM:*\n` +
                    `   \`0 12 1 * *\`\n\n` +

                    `💡 *Consejos:*\n` +
                    `├─ Use \`*\` para indicar "todos"\n` +
                    `├─ Use \`*/n\` para "cada n unidades"\n` +
                    `└─ Los valores múltiples se separan con comas\n\n` +

                    `⚠️ *Importante:*\n` +
                    `_La hora se maneja en formato 24 horas_\n` +
                    `_Todos los tiempos están en zona horaria ${context.jobManager.TARGET_TIMEZONE}_\n\n` +

                    `📱 *Ejemplo de uso:*\n` +
                    `\`!createRecurring trabajo1 573046282936 [0 8 * * *] "Buenos días"\`\n` +
                    `_Este comando enviará "Buenos días" todos los días a las 8:00 AM_`;

                context.sendMessage(id, helpMessage);
            }
        }
    ];
};