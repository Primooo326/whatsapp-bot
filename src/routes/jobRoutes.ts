import {
    getJobs,
    getJobById,
    getJobsByBot,
    createJob,
    updateJobStatus,
    deleteJob
} from "@controllers/jobEnvioMensajeController";
import { Router } from "express";
import authMiddleware from "@/middlewares/authMiddleware";

const router = Router();

// Rutas básicas
router.get("/", authMiddleware, getJobs);
router.get("/:id", authMiddleware, getJobById);
router.get("/bot/:botId", authMiddleware, getJobsByBot);
router.post("/", authMiddleware, createJob);
router.put("/:id/status", authMiddleware, updateJobStatus);
router.delete("/:id", authMiddleware, deleteJob);

export default router;