import { Request, Response } from "express";
import pool from "../config/database";
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Obtener todos los archivos adjuntos de un job
export const getArchivosByJob = async (req: Request, res: Response): Promise<void> => {
    const { jobId } = req.params;

    try {
        const [rows] = await pool.query(
            "SELECT id, jobId, tipo, nombre, url FROM archivos_adjuntos WHERE jobId = ?",
            [jobId]
        );

        res.json(rows);
    } catch (error) {
        console.error("Error al obtener archivos adjuntos:", error);
        res.status(500).json({ message: "Error al obtener archivos adjuntos" });
    }
};

// Obtener un archivo adjunto específico
export const getArchivoById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
        const [rows]: any = await pool.query(
            "SELECT id, jobId, tipo, nombre, url FROM archivos_adjuntos WHERE id = ?",
            [id]
        );

        if (rows.length === 0) {
            res.status(404).json({ message: "Archivo adjunto no encontrado" });
            return;
        }

        res.json(rows[0]);
    } catch (error) {
        console.error("Error al obtener archivo adjunto:", error);
        res.status(500).json({ message: "Error al obtener archivo adjunto" });
    }
};

// Agregar un archivo adjunto a un job existente
export const addArchivo = async (req: Request, res: Response): Promise<void> => {
    const { jobId } = req.params;
    const { tipo, nombre, url } = req.body;

    if (!tipo || !nombre || !url) {
        res.status(400).json({ message: "Faltan datos obligatorios" });
        return;
    }

    // Validar que el tipo sea válido
    if (!['imagen', 'pdf', 'word', 'video'].includes(tipo)) {
        res.status(400).json({ message: "Tipo de archivo no válido" });
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

        // Insertar el archivo adjunto
        const [result] = await pool.query(
            "INSERT INTO archivos_adjuntos (jobId, tipo, nombre, url) VALUES (?, ?, ?, ?)",
            [jobId, tipo, nombre, url]
        );

        res.status(201).json({
            message: "Archivo adjunto agregado exitosamente",
            id: (result as any).insertId
        });
    } catch (error) {
        console.error("Error al agregar archivo adjunto:", error);
        res.status(500).json({ message: "Error al agregar archivo adjunto" });
    }
};

// Actualizar un archivo adjunto
export const updateArchivo = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { tipo, nombre, url } = req.body;

    if (!tipo || !nombre || !url) {
        res.status(400).json({ message: "Faltan datos obligatorios" });
        return;
    }

    // Validar que el tipo sea válido
    if (!['imagen', 'pdf', 'word', 'video'].includes(tipo)) {
        res.status(400).json({ message: "Tipo de archivo no válido" });
        return;
    }

    try {
        const [result] = await pool.query(
            "UPDATE archivos_adjuntos SET tipo = ?, nombre = ?, url = ? WHERE id = ?",
            [tipo, nombre, url, id]
        );

        if ((result as any).affectedRows === 0) {
            res.status(404).json({ message: "Archivo adjunto no encontrado" });
            return;
        }

        res.json({ message: "Archivo adjunto actualizado exitosamente" });
    } catch (error) {
        console.error("Error al actualizar archivo adjunto:", error);
        res.status(500).json({ message: "Error al actualizar archivo adjunto" });
    }
};

// Eliminar un archivo adjunto
export const deleteArchivo = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
        // Primero obtenemos la información del archivo para poder eliminar el archivo físico si es necesario
        const [archivoRows]: any = await pool.query(
            "SELECT url FROM archivos_adjuntos WHERE id = ?",
            [id]
        );

        if (archivoRows.length === 0) {
            res.status(404).json({ message: "Archivo adjunto no encontrado" });
            return;
        }

        // Eliminar el registro de la base de datos
        const [result] = await pool.query(
            "DELETE FROM archivos_adjuntos WHERE id = ?",
            [id]
        );

        if ((result as any).affectedRows === 0) {
            res.status(404).json({ message: "Archivo adjunto no encontrado" });
            return;
        }

        const filePath = path.join(__dirname, '/uploads', path.basename(archivoRows[0].url));
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }


        res.json({ message: "Archivo adjunto eliminado exitosamente" });
    } catch (error) {
        console.error("Error al eliminar archivo adjunto:", error);
        res.status(500).json({ message: "Error al eliminar archivo adjunto" });
    }
};

// Subir un archivo (opcional, si manejas la carga de archivos en el servidor)
export const uploadArchivo = async (req: Request, res: Response): Promise<void> => {
    const { jobId } = req.params;

    if (!req.file) {
        res.status(400).json({ message: "No se ha proporcionado ningún archivo" });
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

        const file = req.file;
        const fileExtension = path.extname(file.originalname).toLowerCase();
        let tipo: string;

        // Determinar el tipo de archivo según la extensión
        if (['.jpg', '.jpeg', '.png', '.gif'].includes(fileExtension)) {
            tipo = 'imagen';
        } else if (fileExtension === '.pdf') {
            tipo = 'pdf';
        } else if (['.doc', '.docx'].includes(fileExtension)) {
            tipo = 'word';
        } else if (['.mp4', '.avi', '.mov'].includes(fileExtension)) {
            tipo = 'video';
        } else {
            res.status(400).json({ message: "Tipo de archivo no soportado" });
            return;
        }

        // Generar un nombre único para el archivo
        const uniqueFileName = `${uuidv4()}${fileExtension}`;

        // La URL dependerá de cómo manejes el almacenamiento y acceso a archivos
        // Aquí asumimos que los archivos se guardan en una carpeta 'uploads' y se acceden por URL
        const fileUrl = `/uploads/${uniqueFileName}`;

        // Insertar el archivo adjunto en la base de datos
        const [result] = await pool.query(
            "INSERT INTO archivos_adjuntos (jobId, tipo, nombre, url) VALUES (?, ?, ?, ?)",
            [jobId, tipo, file.originalname, fileUrl]
        );

        res.status(201).json({
            message: "Archivo subido y adjuntado exitosamente",
            id: (result as any).insertId,
            nombre: file.originalname,
            tipo,
            url: fileUrl
        });
    } catch (error) {
        console.error("Error al subir archivo:", error);
        res.status(500).json({ message: "Error al subir archivo" });
    }
};