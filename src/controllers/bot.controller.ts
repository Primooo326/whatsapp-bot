import { Request, Response } from "express";
import pool from "../config/database";
import BotService from "../services/bot.service";

const botService = new BotService(pool);

export const createBot = async (req: Request, res: Response): Promise<void> => {
    const { userId, name, description, status } = req.body;

    if (!userId || !name || !status) {
        res.status(400).json({ message: "Faltan datos obligatorios" });
        return;
    }

    try {
        const newBot = await botService.createBot(userId, name, description, status);
        res.status(201).json({ message: "Bot creado exitosamente", bot: newBot });
    } catch (error) {
        console.error("Error al crear el bot:", error);
        res.status(500).json({ message: "Error al crear el bot" });
    }
};

export const getBotById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
        const bot = await botService.getBotById(id);
        if (!bot) {
            res.status(404).json({ message: "Bot no encontrado" });
            return;
        }
        res.json(bot);
    } catch (error) {
        console.error("Error al obtener el bot:", error);
        res.status(500).json({ message: "Error al obtener el bot" });
    }
};

export const getBotsByUserId = async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;

    try {
        const bots = await botService.getBotsByUserId(userId);
        res.json(bots);
    } catch (error) {
        console.error("Error al obtener los bots del usuario:", error);
        res.status(500).json({ message: "Error al obtener los bots del usuario" });
    }
}

export const getAllBots = async (req: Request, res: Response): Promise<void> => {
    try {
        const bots = await botService.getAllBots();
        res.json(bots);
    } catch (error) {
        console.error("Error al obtener los bots:", error);
        res.status(500).json({ message: "Error al obtener los bots" });
    }
};

export const updateBot = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { name, description, status } = req.body;

    if (!name || !status) {
        res.status(400).json({ message: "Faltan datos obligatorios" });
        return;
    }

    try {
        const updatedBot = await botService.updateBot(id, name, description, status);
        if (!updatedBot) {
            res.status(404).json({ message: "Bot no encontrado" });
            return;
        }
        res.json({ message: "Bot actualizado exitosamente", bot: updatedBot });
    } catch (error) {
        console.error("Error al actualizar el bot:", error);
        res.status(500).json({ message: "Error al actualizar el bot" });
    }
};

export const deleteBot = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
        await botService.deleteBot(id);
        res.json({ message: "Bot eliminado exitosamente" });
    } catch (error) {
        console.error("Error al eliminar el bot:", error);
        res.status(500).json({ message: "Error al eliminar el bot" });
    }
};