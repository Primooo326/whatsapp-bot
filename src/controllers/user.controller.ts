import { Request, Response } from "express";
import pool from "../config/database";
import UserService from "../services/user.service";

const userService = new UserService(pool);

export const createUser = async (req: Request, res: Response): Promise<void> => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        res.status(400).json({ message: "Faltan datos obligatorios" });
        return;
    }

    try {
        const newUser = await userService.createUser(username, email, password);
        res.status(201).json({ message: "Usuario creado exitosamente", user: newUser });
    } catch (error) {
        console.error("Error al crear el usuario:", error);
        res.status(500).json({ message: "Error al crear el usuario" });
    }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
        const user = await userService.getUserById(id);
        if (!user) {
            res.status(404).json({ message: "Usuario no encontrado" });
            return;
        }
        res.json(user);
    } catch (error) {
        console.error("Error al obtener el usuario:", error);
        res.status(500).json({ message: "Error al obtener el usuario" });
    }
};

export const getUserByEmail = async (req: Request, res: Response): Promise<void> => {
    const { email } = req.params;

    try {
        const user = await userService.getUserByEmail(email);
        if (!user) {
            res.status(404).json({ message: "Usuario no encontrado" });
            return;
        }
        res.json(user);
    } catch (error) {
        console.error("Error al obtener el usuario:", error);
        res.status(500).json({ message: "Error al obtener el usuario" });
    }
};

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const users = await userService.getAllUsers();
        res.json(users);
    } catch (error) {
        console.error("Error al obtener los usuarios:", error);
        res.status(500).json({ message: "Error al obtener los usuarios" });
    }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        res.status(400).json({ message: "Faltan datos obligatorios" });
        return;
    }

    try {
        const updatedUser = await userService.updateUser(id, username, email, password);
        if (!updatedUser) {
            res.status(404).json({ message: "Usuario no encontrado" });
            return;
        }
        res.json({ message: "Usuario actualizado exitosamente", user: updatedUser });
    } catch (error) {
        console.error("Error al actualizar el usuario:", error);
        res.status(500).json({ message: "Error al actualizar el usuario" });
    }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
        await userService.deleteUser(id);
        res.json({ message: "Usuario eliminado exitosamente" });
    } catch (error) {
        console.error("Error al eliminar el usuario:", error);
        res.status(500).json({ message: "Error al eliminar el usuario" });
    }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
        res.status(400).json({ message: "Faltan datos obligatorios" });
        return;
    }

    try {
        const updatedUser = await userService.changePassword(id, password);
        if (!updatedUser) {
            res.status(404).json({ message: "Usuario no encontrado" });
            return;
        }
        res.json({ message: "Contraseña actualizada exitosamente", user: updatedUser });
    } catch (error) {
        console.error("Error al cambiar la contraseña:", error);
        res.status(500).json({ message: "Error al cambiar la contraseña" });
    }
};