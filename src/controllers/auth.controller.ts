import { Request, Response } from "express";
import pool from "../config/database";
import bcrypt from 'bcrypt';
import { generateToken } from "@/utils";
import UserService from "../services/user.service";

const userService = new UserService(pool);

export const login = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({ message: "Faltan datos obligatorios" });
        return;
    }

    try {
        const user = await userService.getUserByEmail(email);

        if (!user) {
            res.status(404).json({ message: "Usuario no encontrado" });
            return;
        }

        // Verifica la contraseña
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            res.status(401).json({ message: "Contraseña incorrecta" });
            return;
        }

        const token = await generateToken({
            id: user.id,
            username: user.username,
            email: user.email
        });

        // Responde con el token y los datos del usuario
        res.json({
            message: "Sesión iniciada con éxito",
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        res.status(500).json({ message: "Error al iniciar sesión" });
    }
};

export const register = async (req: Request, res: Response): Promise<void> => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        res.status(400).json({ message: "Faltan datos obligatorios" });
        return;
    }

    try {
        const existingUserByEmail = await userService.getUserByEmail(email);
        if (existingUserByEmail) {
            res.status(400).json({ message: "Correo electrónico ya registrado" });
            return;
        }

        const newUser = await userService.createUser(username, email, password);

        res.status(201).json({ message: "Usuario creado exitosamente", user: newUser });
    } catch (error) {
        console.error("Error al crear el usuario:", error);
        res.status(500).json({ message: "Error al crear el usuario" });
    }
};