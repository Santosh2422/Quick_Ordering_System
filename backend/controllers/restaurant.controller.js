import Restaurant from '../models/restaurants.model.js'
import User from '../models/user.model.js';
import { generateToken } from '../additionals/jwt.js';

export const createRestaurant = async (req, res) => {
    try {
        const { id, role, restaurantId } = req.user;
        const { mode } = req.query;

        // 🔐 Role check
        if (role !== "owner" && role !== "admin") {
        return res.status(403).json({
            success: false,
            message:
            "Access Denied: Only users with role 'owner' or 'admin' can create restaurants.",
        });
        }

        const { name, description, address, ownerId, logo } = req.body;
        const targetOwnerId = ownerId || id;

        // 📍 Address validation
        if (
        !address ||
        !address.street ||
        !address.city ||
        !address.state ||
        !address.zipCode
        ) {
        return res.status(400).json({
            success: false,
            message: "Complete address details are required.",
        });
        }

        // 🏗 Create restaurant
        const newRestaurant = new Restaurant({
        name,
        description,
        address,
        owner: targetOwnerId,
        image: logo,
        });

        const savedRestaurant = await newRestaurant.save();

        // 🧠 Decide token behavior
        const isDashboardMode = mode === "dashboard";
        const isFirstRestaurant = !restaurantId;

        let token;

        // 🔑 Only onboarding flow regenerates token
        if (isFirstRestaurant && !isDashboardMode) {
            const updatedUser = await User.findByIdAndUpdate(
                targetOwnerId,
                { $set: { restaurantId: savedRestaurant.uid } },
                { new: true, runValidators: true }
            );

            token = generateToken(
                updatedUser._id,
                updatedUser.role,
                updatedUser.restaurantId,
                res
            );
        }

        // ✅ Final response
        return res.status(201).json({
        success: true,
        message: "Restaurant created successfully",
        restaurant: savedRestaurant,
        ...(token && { token }), // include token only if generated
        });
    } catch (error) {
        console.error("Create Restaurant Error:", error);
        return res.status(500).json({
        success: false,
        message: "Server Error",
        error: error.message,
        });
    }
};


export const updateRestaurant = async (req, res) => {
    try {
        const { id, role, restaurantId } = req.user
        const  updates  = req.body;
        console.log("updates: ", updates);
        console.log("ResId: ", restaurantId);

        if (role !== 'owner') {
            return res.status(200).json({
                success: false,
                message: "Access Denied: Only owners can update restaurants."
            });
        }

        // --- LOGIC: Find the Restaurant ---
        const restaurant = await Restaurant.findOne({ uid: restaurantId });
        console.log("restaurant23456: ", restaurant);
        if (!restaurant) {
            return res.status(200).json({ success: false, message: "Restaurant not found" });
        }

        // --- SECURITY 2: Ownership Check ---
        // Crucial: Ensure the logged-in owner actually OWNS this specific restaurant
        if (restaurant.owner.toString() !== id.toString()) {
            return res.status(200).json({
                success: false,
                message: "Unauthorized: You do not own this restaurant."
            });
        }

        if (updates.uid) delete updates.uid;    // Never let them change the UID
        if (updates.owner) delete updates.owner; // Never let them transfer ownership here

        // Update fields
        // We use the spread operator or manual assignment. 
        // For nested objects like 'address', be careful not to overwrite the whole object if only changing city.
        if (updates.name) restaurant.name = updates.name;
        if (updates.description) restaurant.description = updates.description;
        if (updates.image) restaurant.image = updates.image;

        // Smart Address Update (Merge existing with new)
        if (updates.address) {
            restaurant.address = { ...restaurant.address.toObject(), ...updates.address };
        }

        const updatedRestaurant = await restaurant.save();

        res.status(200).json({
            success: true,
            message: "Restaurant updated successfully",
            restaurant: updatedRestaurant
        });

    } catch (error) {
        console.error("Update Restaurant Error:", error);
        res.status(200).json({ success: false, message: "Server Error", error: error.message });
    }
};

export const getAllRestaurants = async (req, res) => {
    try {
        const restaurants = await Restaurant.find({});
        res.status(200).json({ success: true, data: restaurants });
    } catch (error) {
        res.status(200).json({ success: false, message: error.message });
    }
};

export const getRestaurantById = async (req, res) => {
    try {
        const { restaurantId } = req.user;
        const restaurant = await Restaurant.findOne({ uid: restaurantId });
        console.log("restaurant: ", restaurant);
        if (!restaurant) {
            return res.status(200).json({ success: false, message: "Restaurant not found" });
        }
        return res.status(200).json({ success: true, restaurant: restaurant });
    } catch (error) {
        res.status(200).json({ success: false, message: error.message });
    }
};

