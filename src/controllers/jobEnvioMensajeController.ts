import { Request, Response } from "express";
import pool from "../config/database";
import { v4 as uuidv4 } from "uuid";

export const getJobs = async (req: Request, res: Response): Promise<void> => {
    try {
        const [rows] = await pool.query(`
            SELECT j.id, j.botId, j.mensaje, j.creadoEn, j.status
            FROM jobs_envio_mensajes j
            ORDER BY j.creadoEn DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener jobs:", error);
        res.status(500).json({ message: "Error al obtener jobs" });
    }
};

export const getJobById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        // Obtener información básica del job
        const [jobRows]: any = await pool.query(`
            SELECT j.id, j.botId, j.mensaje, j.creadoEn, j.status
            FROM jobs_envio_mensajes j
            WHERE j.id = ?
        `, [id]);

        if (jobRows.length === 0) {
            res.status(404).json({ message: "Job no encontrado" });
            return;
        }

        const job = jobRows[0];

        // Obtener destinatarios
        const [destinatariosRows]: any = await pool.query(`
            SELECT tipo, direccion
            FROM canales_envio
            WHERE jobId = ?
        `, [id]);

        // Obtener archivos adjuntos si existen
        const [adjuntosRows]: any = await pool.query(`
            SELECT tipo, nombre, url
            FROM archivos_adjuntos
            WHERE jobId = ?
        `, [id]);

        // Obtener programación si existe
        const [programacionRows]: any = await pool.query(`
            SELECT tipo, scheduledDate
            FROM programacion_envios
            WHERE jobId = ?
        `, [id]);

        // Construir respuesta completa
        const respuesta = {
            ...job,
            destinatarios: destinatariosRows,
            archivosAdjuntos: adjuntosRows.length > 0 ? adjuntosRows : undefined,
            programacionEnvio: programacionRows.length > 0 ? programacionRows[0] : undefined
        };

        res.json(respuesta);
    } catch (error) {
        console.error("Error al obtener el job:", error);
        res.status(500).json({ message: "Error al obtener el job" });
    }
};

export const getJobsByBot = async (req: Request, res: Response): Promise<void> => {
    const { botId } = req.params;
    try {
        const [rows] = await pool.query(`
            SELECT j.id, j.botId, j.mensaje, j.creadoEn, j.status
            FROM jobs_envio_mensajes j
            WHERE j.botId = ?
            ORDER BY j.creadoEn DESC
        `, [botId]);
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener jobs del bot:", error);
        res.status(500).json({ message: "Error al obtener jobs del bot" });
    }
};

export const createJob = async (req: Request, res: Response): Promise<void> => {
    const newId = uuidv4(); // Genera un UUID automáticamente
    const { botId, mensaje, destinatarios, archivosAdjuntos, programacionEnvio } = req.body;

    if (!botId || !mensaje || !destinatarios || !Array.isArray(destinatarios) || destinatarios.length === 0) {
        res.status(400).json({ message: "Faltan datos obligatorios o formato incorrecto" });
        return;
    }

    // Verificar que el bot existe y está activo
    try {
        const [botRows]: any = await pool.query(
            "SELECT uuid, status FROM bots WHERE uuid = ?",
            [botId]
        );

        if (botRows.length === 0) {
            res.status(404).json({ message: "Bot no encontrado" });
            return;
        }

        if (botRows[0].status !== "activo") {
            res.status(400).json({ message: "El bot no está activo" });
            return;
        }

        // Iniciar transacción
        await pool.query("START TRANSACTION");

        // Insertar el job principal
        await pool.query(
            "INSERT INTO jobs_envio_mensajes (id, botId, mensaje, creadoEn, status) VALUES (?, ?, ?, NOW(), 'pendiente')",
            [newId, botId, mensaje]
        );

        // Insertar destinatarios
        for (const destinatario of destinatarios) {
            if (!destinatario.tipo || !destinatario.direccion) {
                await pool.query("ROLLBACK");
                res.status(400).json({ message: "Formato de destinatario incorrecto" });
                return;
            }

            await pool.query(
                "INSERT INTO canales_envio (jobId, tipo, direccion) VALUES (?, ?, ?)",
                [newId, destinatario.tipo, destinatario.direccion]
            );
        }

        // Insertar archivos adjuntos si existen
        if (archivosAdjuntos && Array.isArray(archivosAdjuntos) && archivosAdjuntos.length > 0) {
            for (const adjunto of archivosAdjuntos) {
                if (!adjunto.tipo || !adjunto.nombre || !adjunto.url) {
                    await pool.query("ROLLBACK");
                    res.status(400).json({ message: "Formato de archivo adjunto incorrecto" });
                    return;
                }

                await pool.query(
                    "INSERT INTO archivos_adjuntos (jobId, tipo, nombre, url) VALUES (?, ?, ?, ?)",
                    [newId, adjunto.tipo, adjunto.nombre, adjunto.url]
                );
            }
        }

        // Insertar programación si existe
        if (programacionEnvio && programacionEnvio.tipo && programacionEnvio.scheduledDate) {
            await pool.query(
                "INSERT INTO programacion_envios (jobId, tipo, scheduledDate) VALUES (?, ?, ?)",
                [newId, programacionEnvio.tipo, programacionEnvio.scheduledDate]
            );
        }

        // Confirmar transacción
        await pool.query("COMMIT");

        res.status(201).json({ message: "Job creado exitosamente", id: newId });
    } catch (error) {
        await pool.query("ROLLBACK");
        console.error("Error al crear el job:", error);
        res.status(500).json({ message: "Error al crear el job" });
    }
};

export const updateJobStatus = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["pendiente", "enviado", "fallido"].includes(status)) {
        res.status(400).json({ message: "Estado no válido" });
        return;
    }

    try {
        const [result] = await pool.query(
            "UPDATE jobs_envio_mensajes SET status = ? WHERE id = ?",
            [status, id]
        );

        if ((result as any).affectedRows === 0) {
            res.status(404).json({ message: "Job no encontrado" });
            return;
        }

        res.json({ message: "Estado del job actualizado exitosamente" });
    } catch (error) {
        console.error("Error al actualizar el estado del job:", error);
        res.status(500).json({ message: "Error al actualizar el estado del job" });
    }
};

export const deleteJob = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
        // Iniciar transacción
        await pool.query("START TRANSACTION");

        // Eliminar registros relacionados primero
        await pool.query("DELETE FROM programacion_envios WHERE jobId = ?", [id]);
        await pool.query("DELETE FROM archivos_adjuntos WHERE jobId = ?", [id]);
        await pool.query("DELETE FROM canales_envio WHERE jobId = ?", [id]);

        // Eliminar el job
        const [result] = await pool.query("DELETE FROM jobs_envio_mensajes WHERE id = ?", [id]);

        if ((result as any).affectedRows === 0) {
            await pool.query("ROLLBACK");
            res.status(404).json({ message: "Job no encontrado" });
            return;
        }

        // Confirmar transacción
        await pool.query("COMMIT");

        res.json({ message: "Job eliminado exitosamente" });
    } catch (error) {
        await pool.query("ROLLBACK");
        console.error("Error al eliminar el job:", error);
        res.status(500).json({ message: "Error al eliminar el job" });
    }
};