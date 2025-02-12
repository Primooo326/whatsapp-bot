import qrcode from 'qrcode-terminal';
import { Client, LocalAuth } from 'whatsapp-web.js';
import { initializeJobs, JobManager } from './jobs';
import { qwen2 } from './api/ollama.api';
// Configuración del cliente
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});
let jobManager: JobManager
// Evento QR
client.on('qr', (qr) => {
    console.log('Escanea este código QR con tu WhatsApp:');
    qrcode.generate(qr, { small: true });
});

// Evento de autenticación
client.on('authenticated', () => {
    console.log('Autenticado con éxito');
});

// Evento de autorización fallida
client.on('auth_failure', (msg) => {
    console.error('Error de autenticación:', msg);
});

// Evento cuando el cliente está listo
client.on('ready', () => {
    console.log('El cliente está listo para usar');
    jobManager = initializeJobs(client);

    jobManager.listAllJobs();

    const currentDate = new Date()
    sendMessage(client.info.wid._serialized, `[${currentDate.toLocaleString()}] El cliente está listo para usar`)

});

// Manejo de mensajes
client.on('message', async (message) => {

    const contact = await message.getChat();
    if (contact.id.user === "573208471126") {

    }

    handleCommand(contact.id._serialized, message.body);
});

client.initialize();

const sendMessage = async (id: string, message: string) => {

    client.sendMessage(id, message);

}

let currentCommand: string = '';

const commands = [
    {
        command: '!help',
        description: '*Lista de comandos*',
        handler: async (id: string) => {
            let message = 'Lista de comandos:\n';
            commands.forEach((command) => {
                message += `${command.command}: ${command.description}\n`;
            });
            sendMessage(id, message);
        }
    },
    {
        command: '!ping',
        description: '*Test ping*',
        handler: async (id: string) => {
            sendMessage(id, 'pong');
        }
    },
    {
        command: '!jobs',
        description: '*Lista de trabajos programados*',
        handler: async (id: string) => {
            const jobs = jobManager.listAllJobs();
            let message = 'Lista de trabajos programados:\n';
            jobs.forEach(([jobId, jobData]) => {
                message += `Job ${jobId}: ${JSON.stringify(jobData.job.getJobInfo)}\n`;
            });
            sendMessage(id, message);
            currentCommand = '';
        }
    },
    {
        command: '!qwen',
        description: '*modelo qwen*:: !qwen <prompt>',
        handler: async (id: string, prompt?: string) => {
            if (prompt) {
                const response = await qwen2(prompt);
                sendMessage(id, response);
            } else {
                sendMessage(id, 'Escribe el prompt para generar el poema');
            }
        }
    }

]

const handleCommand = async (id: string, message: string) => {


    try {
        if (message.trim().startsWith('!')) {

            const command = message.trim().split(' ')[0]
            const args = message.trim().split(' ').slice(1).join(' ')

            const commandFound = commands.find(cm => cm.command === command)
            if (commandFound) {
                commandFound.handler(id, args)
                currentCommand = command
            } else {
                sendMessage(id, `Commando no encontrado: ${command}`)
            }

        }
        else {
            if (currentCommand) {
                const commandFound = commands.find(cm => cm.command === currentCommand)
                if (commandFound) {
                    commandFound.handler(id, message)
                }
            } else {
                console.log('No hay comando actualmente activo')
            }
        }
    } catch (error) {
        console.log(error);
        sendMessage(id, 'Error al procesar el comando');
    }

}


// const getContact = async (phone: string) => {
//     try {
//         const user = await getUser(phone);
//         return user.ok ? user : null;
//     } catch (error) {
//         return null;
//     }
// }