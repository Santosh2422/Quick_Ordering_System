import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { createRestaurant, updateRestaurant, getAllRestaurants, getRestaurantById } from '../controllers/restaurant.controller.js';

const router = express.Router();

router.post("/create", protectRoute, createRestaurant);
router.put("/update", protectRoute, updateRestaurant);
router.get("/all", getAllRestaurants);
router.get("/me", protectRoute, getRestaurantById);

export default router;
