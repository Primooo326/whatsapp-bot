import { Router } from "express";
import {
    createService,
    getServiceById,
    getAllServices,
    updateService,
    deleteService
} from "../controllers/service.controller";
import {
    createServiceExecution,
    getServiceExecutionById,
    getAllServiceExecutions,
    updateServiceExecution,
    deleteServiceExecution
} from "../controllers/serviceExecution.controller";

const router = Router();

// Rutas para servicios
router.post("/services", createService);
router.get("/services/:id", getServiceById);
router.get("/services", getAllServices);
router.put("/services/:id", updateService);
router.delete("/services/:id", deleteService);

// Rutas para ejecuciones de servicios
router.post("/service-executions", createServiceExecution);
router.get("/service-executions/:id", getServiceExecutionById);
router.get("/service-executions", getAllServiceExecutions);
router.put("/service-executions/:id", updateServiceExecution);
router.delete("/service-executions/:id", deleteServiceExecution);

export default router;