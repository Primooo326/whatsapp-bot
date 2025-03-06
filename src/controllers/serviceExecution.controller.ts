import { Request, Response } from "express";
import pool from "../config/database";
import ServiceExecutionService from "../services/serviceExecution.service";

const serviceExecutionService = new ServiceExecutionService(pool);

export const createServiceExecution = async (req: Request, res: Response): Promise<void> => {
    const { serviceId, contactId, status } = req.body;

    if (!serviceId || !status) {
        res.status(400).json({ message: "Faltan datos obligatorios" });
        return;
    }

    try {
        const newServiceExecution = await serviceExecutionService.createServiceExecution(serviceId, contactId, status);
        res.status(201).json({ message: "Ejecución de servicio creada exitosamente", serviceExecution: newServiceExecution });
    } catch (error) {
        console.error("Error al crear la ejecución de servicio:", error);
        res.status(500).json({ message: "Error al crear la ejecución de servicio" });
    }
};

export const getServiceExecutionById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
        const serviceExecution = await serviceExecutionService.getServiceExecutionById(id);
        if (!serviceExecution) {
            res.status(404).json({ message: "Ejecución de servicio no encontrada" });
            return;
        }
        res.json(serviceExecution);
    } catch (error) {
        console.error("Error al obtener la ejecución de servicio:", error);
        res.status(500).json({ message: "Error al obtener la ejecución de servicio" });
    }
};

export const getAllServiceExecutions = async (req: Request, res: Response): Promise<void> => {
    try {
        const serviceExecutions = await serviceExecutionService.getAllServiceExecutions();
        res.json(serviceExecutions);
    } catch (error) {
        console.error("Error al obtener las ejecuciones de servicio:", error);
        res.status(500).json({ message: "Error al obtener las ejecuciones de servicio" });
    }
};

export const updateServiceExecution = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        res.status(400).json({ message: "Faltan datos obligatorios" });
        return;
    }

    try {
        const updatedServiceExecution = await serviceExecutionService.updateServiceExecution(id, status);
        if (!updatedServiceExecution) {
            res.status(404).json({ message: "Ejecución de servicio no encontrada" });
            return;
        }
        res.json({ message: "Ejecución de servicio actualizada exitosamente", serviceExecution: updatedServiceExecution });
    } catch (error) {
        console.error("Error al actualizar la ejecución de servicio:", error);
        res.status(500).json({ message: "Error al actualizar la ejecución de servicio" });
    }
};

export const deleteServiceExecution = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
        await serviceExecutionService.deleteServiceExecution(id);
        res.json({ message: "Ejecución de servicio eliminada exitosamente" });
    } catch (error) {
        console.error("Error al eliminar la ejecución de servicio:", error);
        res.status(500).json({ message: "Error al eliminar la ejecución de servicio" });
    }
};