import {
    getBots,
    getBotById,
    getBotsByUsuario,
    createBot,
    updateBot,
    deleteBot,
    activateBot,
    deactivateBot
} from "@/controllers/botController";
import { Router } from "express";
import authMiddleware from "@/middlewares/authMiddleware";

const router = Router();

// Rutas básicas CRUD
router.get("/", authMiddleware, getBots);
router.get("/:id", authMiddleware, getBotById);
router.get("/usuario/:usuarioId", authMiddleware, getBotsByUsuario);
router.post("/", authMiddleware, createBot);
router.put("/:id", authMiddleware, updateBot);
router.delete("/:id", authMiddleware, deleteBot);

// Rutas adicionales para gestión de estado
router.put("/:id/activate", authMiddleware, activateBot);
router.put("/:id/deactivate", authMiddleware, deactivateBot);

export default router;