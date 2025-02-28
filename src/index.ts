// src/index.ts
import qrcode from 'qrcode-terminal';
import { Client, LocalAuth } from 'whatsapp-web.js';
import { initializeJobs, JobManager } from './jobs';
import { CommandHandler } from './commands';
// import { TextConfig } from './tools/pdf';
// import { formatearFecha, generarPDFConImagen } from './tools/utils';
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

client.on('message_create', async (message) => {
    const contact = await message.getChat();
    await commandHandler.handleCommand(contact.id._serialized, message.body);
});

client.initialize();

// const prueba = async () => {
// const fechaExp = "28/02/2021";
// const fechaExcusa = "28/02/2021";
// const horaCulminada = "10:00AM";

// const textos: TextConfig[] = [
//     {
//         text: formatearFecha(fechaExp),
//         isBold: true,
//         fontSize: 10,
//         x: 50,
//         y: 200
//     },
//     {
//         text: "Felcas",
//         isBold: true,
//         fontSize: 10,
//         x: 50,
//         y: 220
//     },
//     {
//         text: "Asunto: Justificación de Ausencia David Santiago Pulido",
//         isBold: false,
//         fontSize: 10,
//         x: 50,
//         y: 250
//     },

//     {
//         text: "Para UNIVERSIDAD ECCI",
//         isBold: false,
//         fontSize: 10,
//         x: 50,
//         y: 300
//     },
//     {
//         text: `Por medio de la presente, me permito informar que el estudiante David Santiago Pulido, identificado con el número TI1147484236, no pudo asistir a sus clases el día ${formatearFecha(fechaExcusa)} en la universidad debido a su participación en una reunión de carácter obligatorio.`,
//         isBold: false,
//         fontSize: 10,
//         x: 50,
//         y: 350
//     },
//     {
//         text: "Quedamos atentos a cualquier recomendación que consideren necesaria y agradecemos de antemano su atención. Estamos a su disposición para cualquier consulta adicional",
//         isBold: false,
//         fontSize: 10,
//         x: 50,
//         y: 450
//     },
//     {
//         text: "Atentamente,",
//         isBold: false,
//         fontSize: 10,
//         x: 50,
//         y: 500
//     },
//     {
//         text: "Edwin José",
//         isBold: true,
//         fontSize: 10,
//         x: 50,
//         y: 550
//     },
//     {
//         text: "Tel:3014970671",
//         isBold: true,
//         fontSize: 10,
//         x: 50,
//         y: 570
//     },
//     {
//         text: "DEPARTAMENTO DE CONTABILIDAD",
//         isBold: true,
//         fontSize: 10,
//         x: 50,
//         y: 590
//     }

// ];

// await generarPDFConImagen({
//     fechaExp,
//     fechaExcusa,
//     horaCulminada,
//     fileOutPath: "Santiago Pulido Excusa.pdf",
//     imgPath: 'assets/imageSanti.png',
//     textos
// });
// const pdfMedia = MessageMedia.fromFilePath(url);
// }

// prueba()
