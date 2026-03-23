import express from 'express'
import { addQRData, getTables, deleteTable, getMyTables } from '../controllers/qrGeneration.controller.js';
import { protectRoute, isOwner } from '../middleware/auth.middleware.js'

const router = express.Router();

// Public route for customers to verify tables
router.get("/", getTables);

// Protected routes for QR/Table management
router.get("/my-tables", protectRoute, isOwner, getMyTables); // New protected route
router.post("/genQR", protectRoute, isOwner, addQRData);
router.delete("/:tableId", protectRoute, isOwner, deleteTable);

export default router;