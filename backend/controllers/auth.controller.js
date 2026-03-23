
import { generateToken } from "../additionals/jwt.js";
import User from "../models/user.model.js";
import bcrypt from 'bcryptjs'
import { Restaurant } from '../models/restaurants.model.js'



export const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const passwordRegex = /^.{8,}$/;
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if (!name || !email || !password) {
            return res.status(200).json({ success: false, message: "All fields are required" });
        }

        if (!emailRegex.test(email)) {
            return res.status(200).json({
                success: false,
                message: "Enter correct email"
            })
        }

        if (!passwordRegex.test(password)) {
            return res.status(200).json({
                success: false,
                message: 'Password must be at least 8 characters long.'
            });
        }

        const user = await User.findOne({ email });

        if (user) return res.status(200).json({ success: false, message: "User Already exists" });

        const salt = await bcrypt.genSalt(10);

        const hashedPass = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            email: email.toLowerCase(),
            password: hashedPass,
            restaurantId: null,
            mustChangePassword: false,
        })
        //if newUser is created generate token for him with role and restaurantId
        if (newUser) {
            const token = generateToken(newUser._id, newUser.role, newUser.restaurantId, res);
            await newUser.save();

            // Return the same structure frontend expects
            return res.status(200).json({
                success: true,
                message: "Sign Up successful",
                token, // Return token as well
                user: {
                    id: newUser._id,
                    name: newUser.name,
                    email: newUser.email,
                    role: newUser.role,
                    restaurantId: newUser.restaurantId
                }
            })
        }
        else {
            return res.status(200).json({
                success: false,
                message: "Invalid User Data"
            })
        }

    } catch (error) {
        console.log("Error in signup controller: " + error)
        res.status(200).json({ success: false, message: error.message })
    }
}


export const login = async (req, res) => {
    try {
        const { identifier, password, selectedRestaurantId } = req.body;
        console.log("vanakam")

        if (!identifier || !password) {
            return res.status(200).json({ success: false, message: "Identifier and password are required" });
        }

        const cleanIdentifier = identifier.trim();

        // Find user
        const user = await User.findOne({
            $or: [
                { email: cleanIdentifier.toLowerCase() },
                { username: cleanIdentifier }
            ]
        }).select('+password');

        if (!user) {
            return res.status(200).json({ success: false, message: "Invalid credentials" });
        }

        const isPassCorrect = await bcrypt.compare(password, user.password);

        if (!isPassCorrect) {
            return res.status(200).json({ success: false, message: "Invalid credentials" });
        }

        // --- RESTAURANT RESOLUTION LOGIC ---

        // 1. Find all restaurants owned by this user
        const restaurants = await Restaurant.find({ owner: user._id }).select('uid name -_id');

        // 2. SCENARIO: Owner with Multiple Branches (Trigger Selection)
        if (user.role === 'owner' && restaurants.length > 1 && !selectedRestaurantId) {
            return res.status(200).json({
                success: true,
                status: 'selection_required',
                message: 'Please select a branch',
                restaurants: restaurants
            });
        }

        // 3. Determine the Active Restaurant ID
        let activeRestaurantId = null;

        if (user.role === 'owner') {
            if (selectedRestaurantId) {
                // Priority 1: Explicit Selection
                const isOwner = restaurants.find(r => r.uid.toString() === selectedRestaurantId);
                if (!isOwner) return res.status(200).json({ success: false, message: "You do not own this branch" });
                activeRestaurantId = selectedRestaurantId;
            } else if (restaurants.length === 1) {
                // Priority 2: Auto-select single branch
                activeRestaurantId = restaurants[0].uid;
            }
            // Priority 3: No restaurant yet (New Owner) -> activeRestaurantId remains null
        } else {
            // Priority 4: Staff/Kitchen/Cashier (Use assigned ID)
            activeRestaurantId = user.restaurantId;
        }

        // 4. Security Check: Block non-owners/non-admins who have no restaurant
        // (A cashier MUST be assigned to a restaurant to log in)
        // FIX: Allow 'customer' role through without a restaurant association
        if (!activeRestaurantId && !['owner', 'admin', 'customer'].includes(user.role)) {
            return res.status(200).json({ success: false, message: "No active restaurant association found." });
        }

        // 5. Generate Token
        // Works for both: Active Restaurant users AND New Owners (where activeRestaurantId is null)
        const token = generateToken(user._id, user.role, activeRestaurantId, res);

        // 6. Send Response
        return res.status(200).json({
            success: true,
            message: !activeRestaurantId && user.role === 'owner'
                ? "Welcome! Please create your first restaurant."
                : "Login Successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                username: user.username,
                role: user.role,
                restaurantId: activeRestaurantId
            }
        });

    } catch (error) {
        console.error("Login Error:", error);
        return res.status(200).json({ success: false, message: "Server error during login" });
    }
}



export const logout = (req, res) => {
    try {
        const isProduction = process.env.NODE_ENV === "production";

        const cookieOptions = {
            maxAge: 0,
            httpOnly: true,
            sameSite: isProduction ? "strict" : "lax", // MUST MATCH jwt.js
            secure: isProduction,                     // MUST MATCH jwt.js
            path: "/"                                 // MUST MATCH jwt.js
        };

        res.cookie("accessToken", "", cookieOptions);
        res.cookie("refreshToken", "", cookieOptions);

        console.log("Logged out successfully");
        return res.status(200).json({ success: true, message: "Logged Out Successfully" });

    } catch (error) {
        return res.status(200).json({ success: false, message: "Internal Server error" });
    }
}



export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id; // From auth middleware

        // 1. Validation
        if (!currentPassword || !newPassword) {
            return res.status(200).json({ success: false, message: "All fields are required" });
        }

        const passwordRegex = /^.{8,}$/;

        if (!passwordRegex.test(newPassword)) {
            return res.status(200).json({
                success: false,
                message: 'Password must be at least 8 characters long.'
            });
        }

        // 2. Find User (explicitly select password if your schema hides it by default)
        const user = await User.findById(userId).select('+password');

        if (!user) {
            return res.status(200).json({ success: false, message: "User not found" });
        }

        // 3. Verify Current Password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(200).json({ success: false, message: "Current password is incorrect" });
        }

        // 4. Hash New Password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // 5. Save
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password changed successfully"
        });

    } catch (error) {
        console.error("Change Password Error:", error);
        return res.status(200).json({ success: false, message: "Server Error" });
    }
};