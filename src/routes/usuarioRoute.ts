import { createUsuario, deleteUsuario, getUsuarioById, getUsuarios, updateUsuario } from "@/controllers/usuarioController";
import { Router } from "express";
import authMiddleware from "@/middlewares/authMiddleware";
const router = Router();

router.get("/", authMiddleware, getUsuarios);
router.get("/:id", authMiddleware, getUsuarioById);
router.post("/", authMiddleware, createUsuario);
router.put("/:id", authMiddleware, updateUsuario);
router.delete("/:id", authMiddleware, deleteUsuario);
export default router;