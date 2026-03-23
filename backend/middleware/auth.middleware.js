//so to check the validity of user
//check his cookie first
import jwt from "jsonwebtoken"
import User from "../models/user.model.js"

export const protectRoute = async (req, res, next) => {
    try {
        //get the jwt token from cookie thats in req
        const accToken = req.cookies.accessToken //here jwt is the name of token you chose while creating a token
        //to parse cookies put cookie Parser in uindex.js
        //console.log("AccessToken: ", accToken);

        if (!accToken) {
            //if toekn do not exist
            return res.status(200).json({
                success: false,
                message: "Unauthorized- No token Provided",
                isAuthError: true
            });
        }

        //once token is verified 
        //you know the jwt token had userId in it extract it
        //while creating token we have given payLoad as userId
        //this below verify func verifies obt token with secret set
        //if verified it return payLoad which is obj with multiple key value pair that also has userId
        //so if verified correctly decoded variable will have object
        const decoded = jwt.verify(accToken, process.env.JWT_SECRET);
        console.log("Decoded: ", decoded);
        if (!decoded) {
            return res.status(200).json({
                success: false,
                message: "Unauthorised: Invalid Token",
                isAuthError: true
            });
        }
        //you have a obj now
        //if you find user you need to have everything abt user in DB except password
        //the below select func with - vale remove that property from obj and returns the rest
        const user = {
            id: decoded.userId,
            role: decoded.role,
            restaurantId: decoded.restaurantId
        }

        //now send the user detailes to next middleware without password which we rewmoved from previous code
        //the req body of next middleware will have the content we send now in req
        req.user = user;
        next();
    }
    catch (e) {
        console.log("Error in protectRoute:", e.message);

        // CRITICAL FIX: Handle Expiration Specifically
        // If the error is "TokenExpiredError", we MUST send 401.
        // This tells your Frontend Interceptor: "Go get a refresh token!"
        if (e.name === "TokenExpiredError") {
            return res.status(200).json({
                success: false,
                message: "Unauthorized - Token Expired",
                isAuthError: true
            });
        }

        // For other errors (invalid signature, malformed token), we sends 403 or 500
        return res.status(200).json({
            success: false,
            message: "Unauthorized - Invalid Token",
            isAuthError: true
        });

    }
}

export const isAdmin = async (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(200).json({ success: false, message: "Access Denied: Admins only" });
    }
};

export const isOwner = async (req, res, next) => {
    if (req.user && (req.user.role === 'owner' || req.user.role === 'admin')) {
        next();
    } else {
        return res.status(200).json({ success: false, message: "Access Denied: Owners only" });
    }
};