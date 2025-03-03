import { Request, Response } from "express";
import pool from "../config/database";
import bcrypt from 'bcrypt';
import { generateToken } from "@/utils";
import { v4 as uuidv4 } from 'uuid';

export const login = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({ message: "Faltan datos obligatorios" });
        return;
    }

    try {
        // Consulta alusuarios en la base de datos
        const [rows]: any = await pool.query(
            "SELECT uuid, nombre, telefono, correo, contraseña FROM usuarios WHERE correo = ? AND status = 1",
            [email]
        );

        if (rows.length === 0) {
            res.status(404).json({ message: "Usuario no encontrado" });
            return;
        }

        const user = rows[0];

        // Verifica la contraseña
        const passwordMatch = await bcrypt.compare(password, user.contraseña);
        if (!passwordMatch) {
            res.status(401).json({ message: "Contraseña incorrecta" });
            return;
        }

        const token = await generateToken({
            uuid: user.uuid,
            nombre: user.nombre,
            telefono: user.telefono,
            correo: user.correo
        });

        // Responde con el token y los datos delusuarios
        res.json({
            message: "Sesión iniciada con éxito",
            token,
            user: {
                uuid: user.uuid,
                nombre: user.nombre,
                telefono: user.telefono,
                correo: user.correo
            }
        });
    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        res.status(500).json({ message: "Error al iniciar sesión" });
    }
};

export const register = async (req: Request, res: Response): Promise<void> => {
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
}
