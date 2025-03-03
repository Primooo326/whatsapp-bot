import {
    getArchivosByJob,
    getArchivoById,
    addArchivo,
    updateArchivo,
    deleteArchivo,
    uploadArchivo
} from "@/controllers/archivoAdjuntoController";
import { Router } from "express";
import authMiddleware from "@/middlewares/authMiddleware";
import multer from "multer";

// Configuración de multer para la carga de archivos
const storage = multer.diskStorage({
    destination: function (req: any, file: any, cb: any) {
        cb(null, 'uploads/'); // Asegúrate de que esta carpeta exista
    },
    filename: function (req: any, file: any, cb: any) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

const router = Router();

// Rutas para gestionar archivos adjuntos
router.get("/job/:jobId", authMiddleware, getArchivosByJob);
router.get("/:id", authMiddleware, getArchivoById);
router.post("/job/:jobId", authMiddleware, addArchivo);
router.put("/:id", authMiddleware, updateArchivo);
router.delete("/:id", authMiddleware, deleteArchivo);

// Ruta para subir archivos (opcional)
router.post("/upload/job/:jobId", authMiddleware, upload.single('archivo'), uploadArchivo);

export default router;