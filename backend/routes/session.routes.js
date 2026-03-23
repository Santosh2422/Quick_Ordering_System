import express from 'express';
import { startSession, closeSession } from '../controllers/session.controller.js';

const router = express.Router();

router.post("/start", startSession);
router.post("/close/:sessionId", closeSession);

export default router;
