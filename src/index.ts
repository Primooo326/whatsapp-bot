import qrcode from 'qrcode-terminal';
import { Client, LocalAuth } from 'whatsapp-web.js';
import { getUser } from '@api/user.api';
import { getMenu } from '@api/menu.api';

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
});

// Manejo de mensajes
client.on('message', async (message) => {
    console.log('Mensaje recibido:', message.body);

    const contact = await message.getChat();

    console.log(contact);

    const user = await getUser(contact.id._serialized);

    console.log(user);

    if (user.ok) {
        const menu = await getMenu()
        for (const item of menu) {
            const bodyHtml = `<b>${item.nombre_plato}</b><br/>${item.descripcion}<br/>${item.precio}`;
            client.sendMessage(contact.id._serialized, bodyHtml);
        }
    } else {

        const bodyMessage = "No te encuentras registrado, por favor dame tu nombre, numero de teléfono y dirección para poder continuar.";
        client.sendMessage(contact.id._serialized, bodyMessage);
    }

    sendMessage(contact.id._serialized, 'xd');

    if (message.body === '!ping') {
        message.reply('pong');
    }
});


const sendMessage = async (id: string, message: string) => {

    client.sendMessage(id, message);

}

// Inicializar el cliente
client.initialize();