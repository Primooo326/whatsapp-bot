import { Request, Response } from 'express';
import { WhatsAppClientFactory } from '../WhatsAppClientFactory';
import { Chat } from 'whatsapp-web.js';

class MessageController {

    public async sendMessage(req: Request, res: Response): Promise<void> {

        console.log(req.body);
        const { sessionId, to, message } = req.body

        if (!sessionId || !to || !message) {
            res.status(400).send('Faltan parámetros requeridos: sessionId, to, message');
            return;
        }

        try {

            const clientFactory = WhatsAppClientFactory.getInstance();

            const client = clientFactory.getClient(sessionId);

            if (!client) {
                console.log(client);
                res.status(400).send('No se encontró el cliente');
                return;
            }

            const promises = to.map(async (number: string) => {

                const chatId = number + "@c.us";
                const chat: Chat = await client.getChatById(chatId);
                await chat.sendMessage(message);

            });

            await Promise.all(promises);
            res.status(200).send('Mensaje enviado con éxito');
        } catch (error: any) {
            console.error(`Error al enviar mensaje: ${error.message}`);
            res.status(500).send('Error al enviar mensaje');
        }
    }
}

export const messageController = new MessageController();