import express from "express";
import { addUser, getAllUsers, deleteUser, updateUserRole } from "../controllers/admin.controller.js";
import { protectRoute, isAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes here should be protected and only for admins
router.post("/add-user", protectRoute, isAdmin, addUser);
router.get("/users", protectRoute, isAdmin, getAllUsers);
router.delete("/user/:id", protectRoute, isAdmin, deleteUser);
router.patch("/update-role", protectRoute, isAdmin, updateUserRole);

export default router;
