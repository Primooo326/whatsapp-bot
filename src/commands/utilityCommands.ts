// src/commands/utilityCommands.ts
import { Command, CommandContext } from './types';
import { qwen2 } from '../api/ollama.api';
import { formatearFecha, generarPDFConImagen, validarHora } from '@/tools/utils';
import { MessageMedia } from 'whatsapp-web.js';
// import * as path from 'path';
import { TextConfig } from '@/tools/pdf';

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
            description: "*Genera excusa en formato pdf*:: !excusa <fecha de expedición> <fecha de incumplimiento> <hora de incumplimiento>",
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

                const textos: TextConfig[] = [
                    {
                        text: formatearFecha(fechaExp),
                        isBold: true,
                        fontSize: 10,
                        x: 50,
                        y: 200
                    },
                    {
                        text: "La compañía",
                        isBold: false,
                        fontSize: 10,
                        x: 50,
                        y: 250
                    },
                    {
                        text: "THOMAS SEGURIDAD INTEGRAL LTDA",
                        isBold: true,
                        fontSize: 10,
                        x: 130,
                        y: 250
                    },
                    {
                        text: "con",
                        isBold: false,
                        fontSize: 10,
                        x: 385,
                        y: 250
                    },
                    {
                        text: "NIT 830014193-5",
                        isBold: true,
                        fontSize: 10,
                        x: 410,
                        y: 250
                    },
                    {
                        text: "A quien corresponda,",
                        isBold: false,
                        fontSize: 10,
                        x: 50,
                        y: 300
                    },
                    {
                        text: `Por medio de la presente se certifica que el señor Juan Andrés Morales Lizarazo, identificado con cédula de ciudadanía número 1001092278, se encontraba laborando en nuestras instalaciones el día ${formatearFecha(fechaExcusa)} y su jornada laboral culminó a las ${horaCulminada}`,
                        isBold: false,
                        fontSize: 10,
                        x: 50,
                        y: 350
                    },
                    {
                        text: "Este documento se expide a solicitud del interesado para los fines que estime convenientes.",
                        isBold: false,
                        fontSize: 10,
                        x: 50,
                        y: 450
                    },
                    {
                        text: "Atentamente,",
                        isBold: false,
                        fontSize: 10,
                        x: 50,
                        y: 500
                    },
                    {
                        text: "Johnatan Bonilla González",
                        isBold: true,
                        fontSize: 10,
                        x: 50,
                        y: 550
                    },
                    {
                        text: "Líder de desarrollo",
                        isBold: true,
                        fontSize: 10,
                        x: 50,
                        y: 570
                    },
                    {
                        text: "Thomas Seguridad Integral",
                        isBold: true,
                        fontSize: 10,
                        x: 50,
                        y: 590
                    },
                    {
                        text: "(318) 311 7396",
                        isBold: true,
                        fontSize: 10,
                        x: 50,
                        y: 610
                    },
                    {
                        text: "Johnatan.bonilla@tsicol.com",
                        isBold: true,
                        fontSize: 10,
                        x: 50,
                        y: 630
                    },

                ];

                const url = await generarPDFConImagen({
                    fileOutPath: "JuanMoralesExcusa.pdf",
                    imgPath: 'assets/image.png',
                    textos
                });
                const pdfMedia = MessageMedia.fromFilePath(url);
                await context.sendMessage(id, pdfMedia);

            },
        },
        {
            command: "!excusaSanti",
            description: "*Genera excusa en formato pdf*:: !excusaSanti <fecha de expedición> <fecha de incumplimiento>",
            handler: async (id: string, args: string | undefined, context: CommandContext) => {
                if (!args) {
                    context.sendMessage(id, "Formato: !excusaSanti 28/02/2021 28/02/2021");
                    return
                }
                const [fechaExp, fechaExcusa] = args.split(" ");



                const textos: TextConfig[] = [
                    {
                        text: formatearFecha(fechaExp),
                        isBold: true,
                        fontSize: 10,
                        x: 50,
                        y: 200
                    },
                    {
                        text: "Felcas",
                        isBold: true,
                        fontSize: 10,
                        x: 50,
                        y: 220
                    },
                    {
                        text: "Asunto: Justificación de Ausencia David Santiago Pulido",
                        isBold: false,
                        fontSize: 10,
                        x: 50,
                        y: 250
                    },

                    {
                        text: "Para UNIVERSIDAD ECCI",
                        isBold: false,
                        fontSize: 10,
                        x: 50,
                        y: 300
                    },
                    {
                        text: `Por medio de la presente, me permito informar que el estudiante David Santiago Pulido, identificado con el número TI1147484236, no pudo asistir a sus clases el día ${formatearFecha(fechaExcusa)} en la universidad debido a su participación en una reunión de carácter obligatorio.`,
                        isBold: false,
                        fontSize: 10,
                        x: 50,
                        y: 350
                    },
                    {
                        text: "Quedamos atentos a cualquier recomendación que consideren necesaria y agradecemos de antemano su atención. Estamos a su disposición para cualquier consulta adicional",
                        isBold: false,
                        fontSize: 10,
                        x: 50,
                        y: 450
                    },
                    {
                        text: "Atentamente,",
                        isBold: false,
                        fontSize: 10,
                        x: 50,
                        y: 500
                    },
                    {
                        text: "Edwin José",
                        isBold: true,
                        fontSize: 10,
                        x: 50,
                        y: 550
                    },
                    {
                        text: "Tel:3014970671",
                        isBold: true,
                        fontSize: 10,
                        x: 50,
                        y: 570
                    },
                    {
                        text: "DEPARTAMENTO DE CONTABILIDAD",
                        isBold: true,
                        fontSize: 10,
                        x: 50,
                        y: 590
                    }

                ];

                const url = await generarPDFConImagen({
                    fileOutPath: "Santiago Pulido Excusa.pdf",
                    imgPath: 'assets/imageSanti.png',
                    textos
                });
                const pdfMedia = MessageMedia.fromFilePath(url);
                await context.sendMessage(id, pdfMedia);

            },
        },
        //         {
        //             command: "!aurix",
        //             description: "genera mensaje masivo",
        //             handler: async (id: string, args: string | undefined, context: CommandContext) => {

        //                 console.log(id, args);
        //                 const mesageContent = `Hola, me llamo Aura y estoy en contacto contigo desde la Universidad Minuto de Dios. Nos hemos enterado de tu interés en iniciar tu proceso formativo con nosotros.\n\nQueremos informarte que nuestra universidad ofrece cursos introductorios en la carrera de tu elección.Estos cursos no solo te brindarán una visión general de la carrera, sino que, en caso de que decidas continuar con tu proceso formativo, las materias serán homologadas.\n\nSi deseas obtener más información sobre nuestros cursos y programas, por favor responde a este mensaje.Estamos aquí para ayudarte a alcanzar tus objetivos académicos.
        // Pulsa el siguiente enlace:\n\nhttps://wa.me/573132711712 `

        //                 const filePath = path.join(process.cwd(), 'assets', "Brochure_Cursos_Introductorios_Regiones.pdf")

        //                 const numbers = [573112653649,
        //                     573102471601,
        //                     573134637749,
        //                     573219360792,
        //                     573134151115,
        //                     573165353349,
        //                     573219360792,
        //                     573003115468,
        //                     573144172451,
        //                     573212263385,
        //                     573144458876,
        //                     573224053215,
        //                     573014342882,
        //                     573123007309,
        //                     573104282244,
        //                     573237716593,
        //                     573143189604,
        //                     573013994382,
        //                     573027512820,
        //                     573011458579,
        //                     573203747794,
        //                     573125293536,
        //                     573012792821,
        //                     573112878451,
        //                     573102146422,
        //                     573045254525,
        //                     573118359584,
        //                     573112878451,
        //                     573102146422,
        //                     573118359584,
        //                     573203809388,
        //                     573212281087,
        //                     573202446048,
        //                     573006055984,
        //                     573132011886,
        //                     573203982800,]
        //                 // const numbers = [573003709040, 573046282936]
        //                 numbers.forEach(async (phoneNumber) => {
        //                     const chatId = phoneNumber + "@c.us";
        //                     const pdfMedia = MessageMedia.fromFilePath(filePath);
        //                     await context.sendMessage(chatId, mesageContent);
        //                     await context.sendMessage(chatId, pdfMedia);
        //                 })
        //             }
        //         }
    ];
};