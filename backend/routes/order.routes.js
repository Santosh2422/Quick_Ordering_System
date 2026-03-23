import express from "express";
import {
    createOrder,
    updateOrderStatus,
    requestBill,
    processPayment,
    getMyOrders,
    getAllOrders
} from "../controllers/order.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Customer
router.post("/create", createOrder); // Places order
router.get("/session/:sessionId", getMyOrders);
router.post("/request-bill/:orderId", requestBill); // Request bill
router.post("/pay/:orderId", processPayment); // Pay bill

// Cashier/Kitchen (Staff)
router.get("/all", protectRoute, getAllOrders); // Fetch all orders for staff
router.post("/update-status/:orderId", protectRoute, updateOrderStatus);

export default router;
