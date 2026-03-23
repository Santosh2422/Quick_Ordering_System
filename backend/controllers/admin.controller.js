import User from "../models/user.model.js";
import Restaurant from "../models/restaurants.model.js";
import bcrypt from "bcryptjs";

export const addUser = async (req, res) => {
  try {
    const { name, email, username, password, role, restaurantId } = req.body;

    if (!name || !email || !username || !password || !role) {
      return res.status(200).json({ success: false, message: "Missing required fields" });
    }

    const existingUser = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username }] });
    if (existingUser) {
      return res.status(200).json({ success: false, message: "Email or username already in use" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email: email.toLowerCase(),
      username,
      password: hashedPass,
      role,
      restaurantId: restaurantId || null,
      mustChangePassword: false // No longer mandatory as requested
    });

    await newUser.save();

    // --- OWNERSHIP TRANSFER FIX ---
    // If the admin assigned an 'owner' role and provided a restaurantId (UID),
    // we must update the Restaurant model to set this new user as the actual owner.
    if (role === 'owner' && restaurantId) {
      const restaurant = await Restaurant.findOneAndUpdate(
        { uid: restaurantId },
        { $set: { owner: newUser._id } },
        { new: true }
      );
      if (restaurant) {
        console.log(`[Ownership Transfer] Restaurant ${restaurantId} is now owned by ${newUser._id}`);
      }
    }

    res.status(200).json({
      success: true,
      message: `User created successfully with role ${role}.`,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error("Error in admin.addUser:", error);
    res.status(200).json({ success: false, message: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(200).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(200).json({ success: false, message: error.message });
  }
};


export const updateUserRole = async (req, res) => {
  const { email, role } = req.body;

  // 1. Validate Input
  if (!email || !role) {
    return res.status(200).json({
      success: false,
      message: "Please provide both email and role."
    });
  }

  const validRoles = ["owner", "admin", "cashier", "kitchen", "staff"];
  if (!validRoles.includes(role.toLowerCase())) {
    return res.status(200).json({
      success: false,
      message: "Invalid role selected."
    });
  }

  try {
    // 2. Find and Update
    // { new: true } returns the updated document instead of the old one
    const user = await User.findOneAndUpdate(
      { email: email },
      { role: role.toLowerCase() },
      { new: true }
    );

    // 3. Handle User Not Found
    if (!user) {
      return res.status(200).json({
        success: false,
        message: "User not found with this email."
      });
    }

    // 4. Send Success Response
    res.status(200).json({
      success: true,
      message: `User role updated to ${user.role}`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Update Role Error:", error);
    res.status(200).json({
      success: false,
      message: "Server Error: Unable to update role."
    });
  }
};

