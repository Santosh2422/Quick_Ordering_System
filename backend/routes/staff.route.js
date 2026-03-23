import express from 'express';
import { getStaff, addStaff, approveStaff, deleteStaff, updateStaff } from '../controllers/staff.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get("/", protectRoute, getStaff);
router.post("/", protectRoute, addStaff);
router.put("/update/:staffId", protectRoute, updateStaff)
router.patch("/approve/:staffId", protectRoute, approveStaff);
router.delete("/:staffId", protectRoute, deleteStaff);

export default router;
