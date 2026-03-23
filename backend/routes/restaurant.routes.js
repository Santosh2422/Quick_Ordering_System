import express from 'express'
import { protectRoute } from '../middleware/auth.middleware.js';
import { addBulkMenuItems, updateMenuItem, getMenu, deleteMenuItem, deleteCategory } from '../controllers/menuItems.controller.js';

const router = express.Router();

// Public menu endpoint (works in MOCK_MODE)
router.get("/", getMenu);
router.get("/my-menu", protectRoute, getMenu);
router.get("/public/:restaurantId", getMenu);

router.post("/", protectRoute, addBulkMenuItems);
router.post("/update-item", protectRoute, updateMenuItem);
router.delete("/delete-item", protectRoute, deleteMenuItem)
router.delete("/delete-category", protectRoute, deleteCategory)

export default router;