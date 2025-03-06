import { Router } from "express";
import userRoutes from "./user.routes";
import authRoutes from "./auth.routes";
import botRoutes from "./bot.routes";
import contactRoutes from "./contact.routes";
import serviceRoutes from "./service.routes";

const router = Router();

router.use("/users", userRoutes);
router.use("/auth", authRoutes);
router.use("/bots", botRoutes);
router.use("/contacts", contactRoutes);
router.use("/services", serviceRoutes);

export default router;