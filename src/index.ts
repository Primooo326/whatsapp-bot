// src/index.ts
import qrcode from 'qrcode-terminal';
import { Client, LocalAuth } from 'whatsapp-web.js';
import { initializeJobs, JobManager } from './jobs';
import { CommandHandler } from './commands';

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

let jobManager: JobManager;
let commandHandler: CommandHandler;

client.on('qr', (qr) => {
    console.log('Escanea este código QR con tu WhatsApp:');
    qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => {
    console.log('Autenticado con éxito');
});

client.on('auth_failure', (msg) => {
    console.error('Error de autenticación:', msg);
});

client.on('ready', () => {
    console.log('El cliente está listo para usar');
    jobManager = initializeJobs(client);
    commandHandler = new CommandHandler(client, jobManager);

    const currentDate = new Date();
    client.sendMessage(
        client.info.wid._serialized,
        `[${currentDate.toLocaleString()}] El cliente está listo para usar`
    );
});

client.on('message', async (message) => {
    const contact = await message.getChat();

    await commandHandler.handleCommand(contact.id._serialized, message.body);
});

client.initialize();