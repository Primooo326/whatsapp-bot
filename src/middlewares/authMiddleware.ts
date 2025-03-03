import { Request, Response, NextFunction } from "express";
import { verifyToken } from "@/utils";
const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    // Verifica si el encabezado de autorización está presente
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ message: "Token no proporcionado o inválido" });
        return;
    }

    const token = authHeader.split(" ")[1]; // Extrae el token del encabezado

    try {
        // Verifica el token JWT
        await verifyToken(token); // Solo verifica si el token es válido
        // Si el token es válido, continúa con la siguiente función del middleware
        next();
    } catch (error) {
        console.error("Error al verificar el token:", error);
        res.status(403).json({ message: "Token inválido o expirado" });
    }
};

export default authenticateToken;