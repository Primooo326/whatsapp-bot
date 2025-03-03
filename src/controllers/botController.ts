import { Request, Response } from "express";
import pool from "../config/database";
import { v4 as uuidv4 } from 'uuid';

export const getBots = async (req: Request, res: Response): Promise<void> => {
    try {
        // Selecciona solo los campos que deseas devolver
        const [rows] = await pool.query(
            "SELECT uuid, usuarioId, nombre, descripcion, status FROM bots WHERE status != 'suspendido'"
        );
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener bots:", error);
        res.status(500).json({ message: "Error al obtener bots" });
    }
};

export const getBotById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const [rows]: any = await pool.query(
            "SELECT uuid, usuarioId, nombre, descripcion, status FROM bots WHERE uuid = ? AND status != 'suspendido'",
            [id]
        );

        if (rows.length === 0) {
            res.status(404).json({ message: "Bot no encontrado" });
            return;
        }

        res.json(rows[0]);
    } catch (error) {
        console.error("Error al obtener el bot:", error);
        res.status(500).json({ message: "Error al obtener el bot" });
    }
};

export const getBotsByUsuario = async (req: Request, res: Response): Promise<void> => {
    const { usuarioId } = req.params;
    try {
        const [rows] = await pool.query(
            "SELECT uuid, usuarioId, nombre, descripcion, status FROM bots WHERE usuarioId = ? AND status != 'suspendido'",
            [usuarioId]
        );
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener bots del usuario:", error);
        res.status(500).json({ message: "Error al obtener bots del usuario" });
    }
};

export const createBot = async (req: Request, res: Response): Promise<void> => {
    const newUuid = uuidv4(); // Genera un UUID automáticamente
    const { usuarioId, nombre, descripcion } = req.body;

    if (!usuarioId || !nombre || !descripcion) {
        res.status(400).json({ message: "Faltan datos obligatorios" });
        return;
    }

    // Verificar que el usuario existe
    try {
        const [userRows]: any = await pool.query(
            "SELECT uuid FROM usuarios WHERE uuid = ? AND status = 1",
            [usuarioId]
        );

        if (userRows.length === 0) {
            res.status(404).json({ message: "Usuario no encontrado" });
            return;
        }

        // Inserta el bot en la base de datos
        await pool.query(
            "INSERT INTO bots (uuid, usuarioId, nombre, descripcion, status) VALUES (?, ?, ?, ?, 'activo')",
            [newUuid, usuarioId, nombre, descripcion]
        );

        res.status(201).json({ message: "Bot creado exitosamente", uuid: newUuid });
    } catch (error) {
        console.error("Error al crear el bot:", error);
        res.status(500).json({ message: "Error al crear el bot" });
    }
};

export const updateBot = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { nombre, descripcion, status } = req.body;

    if (!nombre || !descripcion || !status) {
        res.status(400).json({ message: "Faltan datos obligatorios" });
        return;
    }

    // Validar que el status sea válido
    if (!['activo', 'inactivo', 'suspendido'].includes(status)) {
        res.status(400).json({ message: "Estado no válido. Debe ser 'activo', 'inactivo' o 'suspendido'" });
        return;
    }

    try {
        const [result] = await pool.query(
            "UPDATE bots SET nombre = ?, descripcion = ?, status = ? WHERE uuid = ?",
            [nombre, descripcion, status, id]
        );

        if ((result as any).affectedRows === 0) {
            res.status(404).json({ message: "Bot no encontrado" });
            return;
        }

        res.json({ message: "Bot actualizado exitosamente" });
    } catch (error) {
        console.error("Error al actualizar el bot:", error);
        res.status(500).json({ message: "Error al actualizar el bot" });
    }
};

export const deleteBot = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query(
            "UPDATE bots SET status = 'suspendido' WHERE uuid = ?",
            [id]
        );

        if ((result as any).affectedRows === 0) {
            res.status(404).json({ message: "Bot no encontrado" });
            return;
        }

        res.json({ message: "Bot eliminado exitosamente" });
    } catch (error) {
        console.error("Error al eliminar el bot:", error);
        res.status(500).json({ message: "Error al eliminar el bot" });
    }
};

export const activateBot = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query(
            "UPDATE bots SET status = 'activo' WHERE uuid = ?",
            [id]
        );

        if ((result as any).affectedRows === 0) {
            res.status(404).json({ message: "Bot no encontrado" });
            return;
        }

        res.json({ message: "Bot activado exitosamente" });
    } catch (error) {
        console.error("Error al activar el bot:", error);
        res.status(500).json({ message: "Error al activar el bot" });
    }
};

export const deactivateBot = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query(
            "UPDATE bots SET status = 'inactivo' WHERE uuid = ?",
            [id]
        );

        if ((result as any).affectedRows === 0) {
            res.status(404).json({ message: "Bot no encontrado" });
            return;
        }

        res.json({ message: "Bot desactivado exitosamente" });
    } catch (error) {
        console.error("Error al desactivar el bot:", error);
        res.status(500).json({ message: "Error al desactivar el bot" });
    }
};