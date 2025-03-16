import { Router } from 'express';
import { messageController } from '../controllers/message.controller';

const router = Router();

router.post('/send', (req, res) => messageController.sendMessage(req, res));

export default router;