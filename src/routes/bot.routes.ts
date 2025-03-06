import { Router } from "express";
import { createBot, getBotById, getAllBots, updateBot, deleteBot } from "../controllers/bot.controller";

const router = Router();

router.post("/bots", createBot);
router.get("/bots/:id", getBotById);
router.get("/bots", getAllBots);
router.put("/bots/:id", updateBot);
router.delete("/bots/:id", deleteBot);

export default router;