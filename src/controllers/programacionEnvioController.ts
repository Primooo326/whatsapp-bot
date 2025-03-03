import { Request, Response } from "express";
import pool from "../config/database";
import cron from "node-cron";

// Obtener la programación de un job específico
export const getProgramacionByJob = async (req: Request, res: Response): Promise<void> => {
    const { jobId } = req.params;

    try {
        const [rows]: any = await pool.query(
            "SELECT id, jobId, tipo, scheduledDate FROM programacion_envios WHERE jobId = ?",
            [jobId]
        );

        if (rows.length === 0) {
            res.status(404).json({ message: "Programación no encontrada para este job" });
            return;
        }

        res.json(rows[0]);
    } catch (error) {
        console.error("Error al obtener programación:", error);
        res.status(500).json({ message: "Error al obtener programación" });
    }
};

// Validar formato de fecha y expresión cron
const validateScheduledDate = (tipo: string, scheduledDate: string): string | null => {
    if (tipo === 'unaVez') {
        // Validar formato YYYY-MM-DD HH:mm:ss
        const dateTimeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
        if (!dateTimeRegex.test(scheduledDate)) {
            return "Formato de fecha y hora inválido. Use YYYY-MM-DD HH:mm:ss";
        }

        // Validar que la fecha sea válida
        const date = new Date(scheduledDate);
        if (isNaN(date.getTime())) {
            return "La fecha proporcionada no es válida";
        }
    } else if (tipo === 'recurrente') {
        // Validar expresión cron
        if (!cron.validate(scheduledDate)) {
            return "Expresión cron inválida. Ejemplo válido: '0 15 * * *' (todos los días a las 15:00)";
        }
    } else {
        return "Tipo de programación inválido. Use 'unaVez' o 'recurrente'";
    }

    return null; // Sin errores
};

// Crear una nueva programación para un job
export const createProgramacion = async (req: Request, res: Response): Promise<void> => {
    const { jobId } = req.params;
    const { tipo = 'unaVez', scheduledDate } = req.body;

    if (!scheduledDate) {
        res.status(400).json({ message: "Falta la fecha de programación" });
        return;
    }

    // Validar tipo y formato de fecha/cron
    const validationError = validateScheduledDate(tipo, scheduledDate);
    if (validationError) {
        res.status(400).json({ message: validationError });
        return;
    }

    try {
        // Verificar que el job existe
        const [jobRows]: any = await pool.query(
            "SELECT id FROM jobs_envio_mensajes WHERE id = ?",
            [jobId]
        );

        if (jobRows.length === 0) {
            res.status(404).json({ message: "Job no encontrado" });
            return;
        }

        // Verificar si ya existe una programación para este job
        const [programacionRows]: any = await pool.query(
            "SELECT id FROM programacion_envios WHERE jobId = ?",
            [jobId]
        );

        if (programacionRows.length > 0) {
            res.status(409).json({
                message: "Ya existe una programación para este job. Use PUT para actualizarla.",
                id: programacionRows[0].id
            });
            return;
        }

        // Crear una nueva programación
        const [result] = await pool.query(
            "INSERT INTO programacion_envios (jobId, tipo, scheduledDate) VALUES (?, ?, ?)",
            [jobId, tipo, scheduledDate]
        );

        res.status(201).json({
            message: "Programación creada exitosamente",
            id: (result as any).insertId
        });
    } catch (error) {
        console.error("Error al crear programación:", error);
        res.status(500).json({ message: "Error al crear programación" });
    }
};

// Actualizar una programación existente
export const updateProgramacion = async (req: Request, res: Response): Promise<void> => {
    const { jobId } = req.params;
    const { tipo, scheduledDate } = req.body;

    if (!tipo || !scheduledDate) {
        res.status(400).json({ message: "Faltan datos obligatorios" });
        return;
    }

    // Validar tipo y formato de fecha/cron
    const validationError = validateScheduledDate(tipo, scheduledDate);
    if (validationError) {
        res.status(400).json({ message: validationError });
        return;
    }

    try {
        // Verificar que el job existe
        const [jobRows]: any = await pool.query(
            "SELECT id FROM jobs_envio_mensajes WHERE id = ?",
            [jobId]
        );

        if (jobRows.length === 0) {
            res.status(404).json({ message: "Job no encontrado" });
            return;
        }

        // Verificar si existe una programación para este job
        const [programacionRows]: any = await pool.query(
            "SELECT id FROM programacion_envios WHERE jobId = ?",
            [jobId]
        );

        if (programacionRows.length === 0) {
            res.status(404).json({
                message: "No existe una programación para este job. Use POST para crearla."
            });
            return;
        }

        // Actualizar la programación existente
        await pool.query(
            "UPDATE programacion_envios SET tipo = ?, scheduledDate = ? WHERE jobId = ?",
            [tipo, scheduledDate, jobId]
        );

        res.json({
            message: "Programación actualizada exitosamente",
            id: programacionRows[0].id
        });
    } catch (error) {
        console.error("Error al actualizar programación:", error);
        res.status(500).json({ message: "Error al actualizar programación" });
    }
};

// Eliminar la programación de un job
export const deleteProgramacion = async (req: Request, res: Response): Promise<void> => {
    const { jobId } = req.params;

    try {
        const [result] = await pool.query(
            "DELETE FROM programacion_envios WHERE jobId = ?",
            [jobId]
        );

        if ((result as any).affectedRows === 0) {
            res.status(404).json({ message: "Programación no encontrada para este job" });
            return;
        }

        res.json({ message: "Programación eliminada exitosamente" });
    } catch (error) {
        console.error("Error al eliminar programación:", error);
        res.status(500).json({ message: "Error al eliminar programación" });
    }
};

// Obtener todas las programaciones (útil para el sistema de envío programado)
export const getAllProgramaciones = async (req: Request, res: Response): Promise<void> => {
    try {
        const [rows] = await pool.query(`
            SELECT p.id, p.jobId, p.tipo, p.scheduledDate, j.mensaje, j.botId, j.status
            FROM programacion_envios p
            JOIN jobs_envio_mensajes j ON p.jobId = j.id
            WHERE j.status = 'pendiente'
            ORDER BY p.scheduledDate
        `);

        res.json(rows);
    } catch (error) {
        console.error("Error al obtener programaciones:", error);
        res.status(500).json({ message: "Error al obtener programaciones" });
    }
};

// Obtener programaciones pendientes para hoy
export const getProgramacionesHoy = async (req: Request, res: Response): Promise<void> => {
    try {
        const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD

        const [rows] = await pool.query(`
            SELECT p.id, p.jobId, p.tipo, p.scheduledDate, j.mensaje, j.botId, j.status
            FROM programacion_envios p
            JOIN jobs_envio_mensajes j ON p.jobId = j.id
            WHERE (
                (p.tipo = 'unaVez' AND p.scheduledDate LIKE ?) OR
                p.tipo = 'recurrente'
            ) AND j.status = 'pendiente'
            ORDER BY p.scheduledDate
        `, [`${today}%`]); // Busca fechas que empiecen con el día de hoy

        res.json(rows);
    } catch (error) {
        console.error("Error al obtener programaciones de hoy:", error);
        res.status(500).json({ message: "Error al obtener programaciones de hoy" });
    }
};

// Obtener programaciones recurrentes
export const getProgramacionesRecurrentes = async (req: Request, res: Response): Promise<void> => {
    try {
        const [rows] = await pool.query(`
            SELECT p.id, p.jobId, p.tipo, p.scheduledDate, j.mensaje, j.botId, j.status
            FROM programacion_envios p
            JOIN jobs_envio_mensajes j ON p.jobId = j.id
            WHERE p.tipo = 'recurrente' AND j.status = 'pendiente'
            ORDER BY p.scheduledDate
        `);

        res.json(rows);
    } catch (error) {
        console.error("Error al obtener programaciones recurrentes:", error);
        res.status(500).json({ message: "Error al obtener programaciones recurrentes" });
    }
};