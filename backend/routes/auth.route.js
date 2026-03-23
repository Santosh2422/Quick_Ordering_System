import express from 'express'
import { signup, login, logout, changePassword } from '../controllers/auth.controller.js'
import { protectRoute } from '../middleware/auth.middleware.js';
import { updateStaff } from '../controllers/staff.controller.js';


const router = express.Router();


router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.put("/change-password", protectRoute, changePassword)

router.patch("/profile", protectRoute, updateStaff);

export default router;
