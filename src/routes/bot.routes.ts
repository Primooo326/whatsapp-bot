import { Router } from "express";
import { createBot, getBotById, getBotsByUserId, getAllBots, updateBot, deleteBot } from "../controllers/bot.controller";

const router = Router();

router.post("/", createBot);
router.get("/user/:userId", getBotsByUserId);
router.get("/:id", getBotById);
router.get("/", getAllBots);
router.put("/:id", updateBot);
router.delete("/:id", deleteBot);

export default router;