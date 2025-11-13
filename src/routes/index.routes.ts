import { messageController } from "@/controllers/message.controller";
import { Router } from "express";

const router = Router();


router.post("/send-message", messageController.sendMessage);

export default router;