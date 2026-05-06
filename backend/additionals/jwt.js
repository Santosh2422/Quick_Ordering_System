import jwt from "jsonwebtoken";

export const generateToken = (userId, role, restaurantId, res) => {
    const accessToken = jwt.sign({ userId, role, restaurantId }, process.env.JWT_SECRET, {
        expiresIn: "15m"
    });

    // Determine if we are in production
    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("accessToken", accessToken, {
        maxAge: 15 * 60 * 1000,
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax",
        secure: isProduction,
        path: "/"
    });

    const refreshToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });

    res.cookie("refreshToken", refreshToken, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax",
        secure: isProduction,
        path: "/"
    });

    return accessToken;
};
