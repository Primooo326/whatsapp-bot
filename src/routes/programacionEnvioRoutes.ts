import {
    getProgramacionByJob,
    createProgramacion,
    updateProgramacion,
    deleteProgramacion,
    getAllProgramaciones,
    getProgramacionesHoy,
    getProgramacionesRecurrentes
} from "@/controllers/programacionEnvioController";
import { Router } from "express";
import authMiddleware from "@/middlewares/authMiddleware";

const router = Router();

// Rutas para gestionar programaciones de envío
router.get("/job/:jobId", authMiddleware, getProgramacionByJob);
router.post("/job/:jobId", authMiddleware, createProgramacion);
router.put("/job/:jobId", authMiddleware, updateProgramacion);
router.delete("/job/:jobId", authMiddleware, deleteProgramacion);

// Rutas para el sistema de envío programado
router.get("/all", authMiddleware, getAllProgramaciones);
router.get("/today", authMiddleware, getProgramacionesHoy);
router.get("/recurrentes", authMiddleware, getProgramacionesRecurrentes);

export default router;