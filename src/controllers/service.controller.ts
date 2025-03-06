import { Request, Response } from "express";
import pool from "../config/database";
import ServiceService from "../services/service.service";

const serviceService = new ServiceService(pool);

export const createService = async (req: Request, res: Response): Promise<void> => {
    const { botId, name, category, description, scheduledDate, scheduledType, status } = req.body;

    if (!botId || !name || !category || !scheduledType || !status) {
        res.status(400).json({ message: "Faltan datos obligatorios" });
        return;
    }

    try {
        const newService = await serviceService.createService(botId, name, category, description, scheduledDate, scheduledType, status);
        res.status(201).json({ message: "Servicio creado exitosamente", service: newService });
    } catch (error) {
        console.error("Error al crear el servicio:", error);
        res.status(500).json({ message: "Error al crear el servicio" });
    }
};

export const getServiceById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
        const service = await serviceService.getServiceById(id);
        if (!service) {
            res.status(404).json({ message: "Servicio no encontrado" });
            return;
        }
        res.json(service);
    } catch (error) {
        console.error("Error al obtener el servicio:", error);
        res.status(500).json({ message: "Error al obtener el servicio" });
    }
};

export const getAllServices = async (req: Request, res: Response): Promise<void> => {
    try {
        const services = await serviceService.getAllServices();
        res.json(services);
    } catch (error) {
        console.error("Error al obtener los servicios:", error);
        res.status(500).json({ message: "Error al obtener los servicios" });
    }
};

export const updateService = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { name, category, description, scheduledDate, scheduledType, status } = req.body;

    if (!name || !category || !scheduledType || !status) {
        res.status(400).json({ message: "Faltan datos obligatorios" });
        return;
    }

    try {
        const updatedService = await serviceService.updateService(id, name, category, description, scheduledDate, scheduledType, status);
        if (!updatedService) {
            res.status(404).json({ message: "Servicio no encontrado" });
            return;
        }
        res.json({ message: "Servicio actualizado exitosamente", service: updatedService });
    } catch (error) {
        console.error("Error al actualizar el servicio:", error);
        res.status(500).json({ message: "Error al actualizar el servicio" });
    }
};

export const deleteService = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
        await serviceService.deleteService(id);
        res.json({ message: "Servicio eliminado exitosamente" });
    } catch (error) {
        console.error("Error al eliminar el servicio:", error);
        res.status(500).json({ message: "Error al eliminar el servicio" });
    }
};