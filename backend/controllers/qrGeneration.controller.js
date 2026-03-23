import { v4 as uuidv4 } from 'uuid';
import qrTable from '../models/qr.model.js';
import { Restaurant } from '../models/restaurants.model.js'; // Import Restaurant model
import QRCode from 'qrcode';
import cloudinary from '../additionals/cloudinary.js';
import mongoose from 'mongoose';

export const addQRData = async (req, res) => {
    try {
        // 1. Get restaurantId from JWT (Assumes your auth middleware puts it in req.user)
        const { restaurantId, id } = req.user;
        const { tableName } = req.body;

        if (!tableName) {
            return res.status(200).json({ success: false, message: "Table name is required" });
        }
        const existingTable = await qrTable.findOne({
            restaurantId: restaurantId,
            tableName: tableName,
        });

        // 2. If it exists, don't generate a new one. Just send back the old data.
        if (existingTable) {
            return res.status(200).json({
                success: true,
                message: "Table already exists!",
                tableId: existingTable.tableShortId,
                restaurantId: existingTable.restaurantId
            });
        }

        const tableSecretId = uuidv4().split('-')[0];

        const newTable = await qrTable.create({
            restaurantId,
            tableShortId: tableSecretId, // The unique key
            tableName,

        });
        res.status(201).json({
            success: true,
            message: "Table and its secret generated successfully",
            tableId: newTable.tableShortId,
            restaurantId: newTable.restaurantId
        });

    } catch (error) {
        console.error("Error creating table:", error);
        res.status(200).json({ success: false, message: "Internal Server Error" });
    }
};

// Public route
export const getTables = async (req, res) => {
    try {
        const { restaurantId } = req.query;

        // Allow public access - no authentication required
        if (!restaurantId) {
            return res.status(200).json({ success: false, message: "Restaurant ID is required" });
        }

        const tables = await qrTable.find({ restaurantId });
        res.status(200).json({ success: true, data: tables });
    } catch (error) {
        console.error("Error fetching tables:", error);
        res.status(200).json({ success: false, message: error.message });
    }
};

// Protected route for Owners
export const getMyTables = async (req, res) => {
    try {
        const { userId } = req.user;

        // Find restaurant by owner ID
        const restaurant = await Restaurant.findOne({ owner: userId });
        if (!restaurant) {
            return res.status(200).json({ success: false, message: "Restaurant not found" });
        }

        const tables = await qrTable.find({ restaurantId: restaurant.uid });
        res.status(200).json({ success: true, data: tables });
    } catch (error) {
        console.error("Error fetching my tables:", error);
        res.status(200).json({ success: false, message: error.message });
    }
};

export const deleteTable = async (req, res) => {
    try {
        const { tableId } = req.params; // this is the _id from the frontend call
        const table = await qrTable.findByIdAndDelete(tableId);

        if (table && table.tableShortId) {
            // Optional: delete from cloudinary too
            // await cloudinary.uploader.destroy(`food_app/qr_codes/${table.restaurantId}/table_${table.tableShortId}`);
        }

        res.status(200).json({ success: true, message: "Table deleted successfully" });
    } catch (error) {
        console.error("Error deleting table:", error);
        res.status(200).json({ success: false, message: error.message });
    }
};