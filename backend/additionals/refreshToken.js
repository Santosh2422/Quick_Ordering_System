import jwt from "jsonwebtoken";
import User from "../models/user.model.js"; 

export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            // ❌ CHANGE: Use 401 so the frontend Interceptor's 'catch' block runs
            return res.status(401).json({ success: false, message: "Unauthorized - No Refresh Token" });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            // ❌ CHANGE: Use 401
            return res.status(401).json({ success: false, message: "User not found" });
        }

        const activeRestaurantId = req.body.restaurantId || user.restaurantId;

        const newAccessToken = jwt.sign(
            {
                userId: user._id,
                role: user.role,
                restaurantId: activeRestaurantId 
            },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        const isProduction = process.env.NODE_ENV === "production";

        res.cookie("accessToken", newAccessToken, {
            maxAge: 15 * 60 * 1000, // 15 minutes
            httpOnly: true,
            sameSite: isProduction ? "strict" : "lax",
            secure: isProduction,
            path: "/" // Always specify root path
        });

        // ✅ KEEP: This is the only one that should be 200
        res.status(200).json({
            success: true,
            message: "Token refreshed successfully",
            token: newAccessToken,
            restaurantId: activeRestaurantId 
        });

    } catch (error) {
        console.log("Error in refreshToken controller", error.message);
        // ❌ CHANGE: Use 403 for an invalid/expired refresh token
        return res.status(403).json({ success: false, message: "Invalid Refresh Token" });
    }
};