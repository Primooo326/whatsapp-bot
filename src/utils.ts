import jwt from "jsonwebtoken";
import { JWT_SECRET } from "./constants";

// Función para generar un token JWT
export const generateToken = (data: any): string => {
    // Genera el token JWT
    const token = jwt.sign(data, JWT_SECRET, {
        algorithm: "HS256", // Algoritmo de firma
        expiresIn: "7d", // Tiempo de expiración
    });

    return token;
};

// Función para verificar un token JWT
export const verifyToken = (token: string): any => {
    try {
        // Verifica el token JWT
        const payload = jwt.verify(token, JWT_SECRET, {
            algorithms: ["HS256"], // Algoritmo de firma esperado
        });

        return payload; // Devuelve el contenido del token
    } catch (error) {
        throw new Error("Token inválido o expirado"); // Manejo de errores
    }
};