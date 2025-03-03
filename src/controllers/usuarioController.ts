import { Request, Response } from "express";
import pool from "../config/database";
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

export const getUsuarios = async (req: Request, res: Response): Promise<void> => {
    try {
        // Selecciona solo los campos que deseas devolver
        const [rows] = await pool.query(
            "SELECT uuid, nombre, telefono, correo FROM usuarios WHERE status = 1"
        );
        res.json(rows);
    } catch (error) {
        console.error("Error al obtenerusuarioss:", error);
        res.status(500).json({ message: "Error al obtenerusuarioss" });
    }
};

export const getUsuarioById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const [rows]: any = await pool.query(
            "SELECT uuid, nombre, telefono, correo FROM usuarios WHERE uuid = ? AND status = 1",
            [id]
        );

        if (rows.length === 0) {
            res.status(404).json({ message: "Usuario no encontrado" });
            return;
        }

        res.json(rows[0]);
    } catch (error) {
        console.error("Error al obtener elusuarios:", error);
        res.status(500).json({ message: "Error al obtener elusuarios" });
    }
};

export const createUsuario = async (req: Request, res: Response): Promise<void> => {
    const newUuid = uuidv4(); // Genera un UUID automáticamente
    const { nombre, telefono, correo, contraseña } = req.body;

    if (!nombre || !telefono || !correo || !contraseña) {
        res.status(400).json({ message: "Faltan datos obligatorios" });
        return;
    }

    if (correo) {
        const row: any = await pool.query("SELECT * FROM usuarios WHERE correo = ? AND status = 1", [correo]);
        if (row[0].length > 0) {
            res.status(400).json({ message: "Correo electrónico ya registrado" });
            return;
        }
    }

    if (telefono) {
        const row: any = await pool.query("SELECT * FROM usuarios WHERE telefono = ? AND status = 1", [telefono]);
        if (row[0].length > 0) {
            res.status(400).json({ message: "Teléfono ya registrado" });
            return;
        }
    }

    try {
        // Cifra la contraseña con bcrypt
        const saltRounds = 10; // Número de rondas de sal (puedes ajustarlo según tus necesidades)
        const hashedPassword = await bcrypt.hash(contraseña, saltRounds);

        // Inserta elusuarios en la base de datos con la contraseña cifrada
        await pool.query(
            "INSERT INTO usuarios (uuid, nombre, telefono, correo, contraseña) VALUES (?, ?, ?, ?, ?)",
            [newUuid, nombre, telefono, correo, hashedPassword]
        );

        res.status(201).json({ message: "Usuario creado exitosamente", uuid: newUuid });
    } catch (error) {
        console.error("Error al crear el usuario:", error);
        res.status(500).json({ message: "Error al crear el usuario" });
    }
};

export const updateUsuario = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { nombre, telefono, correo, rol } = req.body;

    if (!nombre || !telefono || !correo || !rol) {
        res.status(400).json({ message: "Faltan datos obligatorios" });
        return;
    }

    if (correo) {
        const row: any = await pool.query("SELECT * FROM usuarios WHERE correo = ? AND status = 1", [correo]);
        if (row[0].length > 0 && row[0].some((item: any) => item.uuid !== id)) {
            res.status(400).json({ message: "Correo electrónico ya registrado" });
            return;

        }
    }

    if (telefono) {
        const row: any = await pool.query("SELECT * FROM usuarios WHERE telefono = ? AND status = 1", [telefono]);
        if (row[0].length > 0 && row[0].some((item: any) => item.uuid !== id)) {
            res.status(400).json({ message: "Teléfono ya registrado" });
            return;
        }
    }

    try {
        const [result] = await pool.query(
            "UPDATEusuarios SET nombre = ?, telefono = ?, correo = ? WHERE uuid = ?",
            [nombre, telefono, correo, id]
        );
        if ((result as any).affectedRows === 0) res.status(404).json({ message: "Usuario no encontrado" });
        res.json({ message: "Usuario actualizado exitosamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar elusuarios" });
    }
};

export const deleteUsuario = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query("UPDATE usuarios SET status = 0 WHERE uuid = ?", [id]);
        if ((result as any).affectedRows === 0) res.status(404).json({ message: "Usuario no encontrado" });
        res.json({ message: "Usuario eliminado exitosamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar elusuarios" });
    }
};