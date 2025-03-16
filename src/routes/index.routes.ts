import { messageController } from "@/controllers/message.controller";
import { Router } from "express";

const router = Router();


router.use("/wha", messageController.sendMessage);

export default router;