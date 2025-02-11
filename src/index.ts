import qrcode from 'qrcode-terminal';
import { Client, LocalAuth } from 'whatsapp-web.js';
// import { getUser } from '@api/user.api';
// import { getMenu } from '@api/menu.api';
import { initializeJobs, JobManager } from './jobs';
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
    console.log('Mensaje recibido:', message.body);

    const contact = await message.getChat();
    console.log(contact);

    if (contact.id.user === "573208471126") {

    }

    if (message.body === '!ping') {
        message.reply('pong');
    }
});

client.initialize();

const sendMessage = async (id: string, message: string) => {

    client.sendMessage(id, message);

}

// const getContact = async (phone: string) => {
//     try {
//         const user = await getUser(phone);
//         return user.ok ? user : null;
//     } catch (error) {
//         return null;
//     }
// }