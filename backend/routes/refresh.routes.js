import express from 'express'
import { refreshToken } from '../additionals/refreshToken.js';
const router = express.Router();

router.post("/token", refreshToken);

export default router