import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

export const getStaff = async (req, res) => {
    try {
        const { restaurantId } = req.user;
        const staff = await User.find({
            restaurantId,
            role: { $in: ['staff', 'kitchen', 'cashier'] }
        });
        res.status(200).json({ success: true, data: staff });
    } catch (error) {
        res.status(200).json({ success: false, message: "Internal Server Error" });
    }
};

export const addStaff = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const { restaurantId } = req.user;

        if (!restaurantId) {
            return res.status(200).json({ success: false, message: "Host restaurant not found for your account." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'staff',
            restaurantId,
            status: 'APPROVED' // Owners adding staff should be approved by default
        });
        res.status(200).json({ success: true, message: "Staff added and approved", data: user });
    } catch (error) {
        res.status(200).json({ success: false, message: error.message });
    }
};

export const approveStaff = async (req, res) => {
    try {
        const { staffId } = req.params;
        await User.findByIdAndUpdate(staffId, { status: 'APPROVED' });
        res.status(200).json({ success: true, message: "Staff approved" });
    } catch (error) {
        res.status(200).json({ success: false, message: error.message });
    }
};

export const deleteStaff = async (req, res) => {
    try {
        const { staffId } = req.params;
        await User.findByIdAndDelete(staffId);
        res.status(200).json({ success: true, message: "Staff deleted" });
    } catch (error) {
        res.status(200).json({ success: false, message: error.message });
    }
};

export const updateStaff = async (req, res) => {
    try {
        // 1. Get ID from URL (to find the user) and Data from Body (to update)
        const { staffId } = req.params;
        const { email, role, name, password } = req.body;

        const { role: providerRole, restaurantId: providerRestId } = req.user;

        // 2. Check Permissions
        if (providerRole === 'admin' || (providerRole === 'owner' && providerRestId)) {

            // 3. Prepare Update Object
            const updateData = {};
            if (role) updateData.role = role;
            if (email) updateData.email = email;
            if (name) updateData.name = name;

            // Note: If you are hashing passwords, do it here before assigning
            if (password && password.trim() !== "") {
                updateData.password = password;
            }

            if (Object.keys(updateData).length === 0) {
                return res.status(200).json({ success: false, message: "No update data provided" });
            }

            // 4. Update using ID + RestaurantID (Security Check)
            // We search by ID (stable) AND RestaurantID (security - ensures they belong to this owner)
            const updatedUser = await User.findOneAndUpdate(
                {
                    _id: new mongoose.Types.ObjectId(staffId),
                    restaurantId: providerRestId
                },
                updateData,
                { new: true, runValidators: true }
            );

            if (!updatedUser) {
                return res.status(200).json({ success: false, message: "Staff not found or does not belong to your restaurant." });
            }

            return res.status(200).json({
                success: true,
                message: 'User updated successfully.',
                data: { user: updatedUser }
            });
        } else {
            return res.status(200).json({ success: false, message: "Unauthorized." });
        }

    } catch (error) {
        console.error("Error updating user:", error);
        return res.status(200).json({ success: false, message: "Internal Server Error" });
    }
};
