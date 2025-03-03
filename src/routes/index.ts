import { Router } from "express";
import usuarioRoutes from "./usuarioRoute";
import authRoutes from "./authRoute";
import botRoutes from "./botRoute";
import archivoAdjuntoRoutes from "./archivoAdjuntoRoutes";
import jobRoutes from "./jobRoutes";
import programacionEnvioRoutes from "./programacionEnvioRoutes";
const router = Router();

router.use("/usuarios", usuarioRoutes);
router.use("/auth", authRoutes);
router.use("/bots", botRoutes);
router.use("/archivos", archivoAdjuntoRoutes);
router.use("/programacion", programacionEnvioRoutes);
router.use("/jobs", jobRoutes);
export default router;