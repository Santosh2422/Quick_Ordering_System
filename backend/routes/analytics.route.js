import express from 'express'
import { getBusiestTables, getCategoryRevenueLeaderboard, getHighRevenueItems, getLowPerformingItems, getTableTurnaroundTime, getTopItems, getTopItemsByCategory, getTotalRevenue } from '../controllers/analytics.controller.js';
import {protectRoute, isOwner} from '../middleware/auth.middleware.js'

const router = express.Router();

router.get("/top-selling", protectRoute, isOwner, getTopItems);
router.get("/total-revenue", protectRoute, isOwner, getTotalRevenue);
router.get("/slow-movers", protectRoute, isOwner, getLowPerformingItems);
router.get("/high-revenue-items", protectRoute, isOwner, getHighRevenueItems);
router.get("/get-top-category-wise-quantity", protectRoute, isOwner, getTopItemsByCategory);
router.get("/get-top-category-wise-revenue", protectRoute, isOwner, getCategoryRevenueLeaderboard);
router.get("/get-table-turnaround-time", protectRoute, isOwner, getTableTurnaroundTime);
router.get("/get-table-stats", protectRoute, isOwner, getBusiestTables);


export default router;