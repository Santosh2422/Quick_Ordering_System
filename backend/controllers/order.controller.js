// controllers/order.controller.js
import Order from "../models/orders.model.js";
import Menu from "../models/menu.model.js";
import Session from "../models/session.model.js";
import mongoose from "mongoose";

export const createOrder = async (req, res) => {
    try {
        const { restaurantId, tableNumber, items, sessionId, customerPhone, instructions } = req.body;
        console.log("Instructions: ", instructions);
        // 0. Resolve Human-Readable Table Name from Session
        // We favor the tableNumber stored in the session document which is already resolved to a friendly name.
        let resolvedTableNumber = tableNumber;
        try {
            const activeSession = await Session.findById(sessionId);
            if (activeSession && activeSession.tableNumber) {
                resolvedTableNumber = activeSession.tableNumber;
            }
        } catch (err) {
            console.warn("[Order] Could not resolve table name from session, using provided value.");
        }

        // 1. Basic Validation
        if (!items || items.length === 0) {
            return res.status(200).json({ success: false, message: "No items in order" });
        }

        console.log("Processing Order for Rest ID:", restaurantId);

        // 2. Prepare IDs for Query
        // restaurantId is a String (UID), so we use it directly.
        // itemIds are ObjectIds inside the Menu, so we must cast them.
        const allItemIds = items.map(i => i.itemId);

        // Filter out invalid ID formats to prevent crashes
        const validObjectIds = allItemIds
            .filter(id => mongoose.Types.ObjectId.isValid(id))
            .map(id => new mongoose.Types.ObjectId(id));

        if (validObjectIds.length !== allItemIds.length) {
            return res.status(200).json({ success: false, message: "Invalid Item ID format detected" });
        }

        // 3. Fetch Items using Aggregation (Required for Nested Menu Structure)
        const products = await Menu.aggregate([
            // A. Find the Menu for this specific Restaurant UID
            { $match: { restaurantId: restaurantId } },

            // B. Unwind Categories array
            { $unwind: "$categories" },

            // C. Unwind Items array (Flattens the structure to individual items)
            { $unwind: "$categories.items" },

            // D. Filter: Keep only items that are in our order list
            { $match: { "categories.items._id": { $in: validObjectIds } } },

            // E. Format: Return clean objects representing the items
            {
                $project: {
                    _id: "$categories.items._id",
                    name: "$categories.items.name",
                    price: "$categories.items.price"
                }
            }
        ]);

        console.log(`Found ${products.length} matching products.`);

        // 4. Validate that all requested items exist
        // We compare unique IDs because the user might have ordered 2 of the same item,
        // but the DB only returns 1 document for it.
        const uniqueRequestedIds = [...new Set(allItemIds)];

        if (products.length !== uniqueRequestedIds.length) {
            return res.status(200).json({
                success: false,
                message: "One or more items are invalid or do not belong to this restaurant."
            });
        }

        // 5. Create a Map for O(1) lookup during calculation
        const productMap = {};
        products.forEach(product => {
            productMap[product._id.toString()] = product;
        });

        // 6. Calculate Totals & Build Order Object
        let grandTotal = 0;
        const orderItems = [];

        for (const item of items) {
            const product = productMap[item.itemId];

            // Double check (redundant but safe)
            if (!product) {
                return res.status(200).json({ success: false, message: `Item ${item.itemId} not found` });
            }

            const itemTotal = product.price * item.quantity;
            grandTotal += itemTotal;

            orderItems.push({
                menuItemId: product._id, // This is the ObjectId from Menu
                name: product.name,
                price: product.price,
                quantity: item.quantity,
                totalPrice: itemTotal, 
            });
        }

        // 7. Save to Database
        const newOrder = await Order.create({
            sessionId: sessionId,
            restaurantId: restaurantId, // Storing the String UID
            tableNumber: resolvedTableNumber,
            customerPhone: customerPhone,
            items: orderItems,
            instructions: String(instructions || "").trim(),
            totalAmount: grandTotal,
            status: 'placed',
        });

        // 8. Socket.io Logic
        const io = req.io;
        if (io) {
            const kitchenRoom = `rest_${restaurantId}_kitchen`;
            const cashierRoom = `rest_${restaurantId}_cashier`;
            const custRoom = `session_${sessionId}`;

            io.to(kitchenRoom).emit("new_order_received", newOrder);
            io.to(cashierRoom).emit("new_order_received", newOrder);
            io.to(custRoom).emit("new_order_received", newOrder);

            console.log(`Socket emitted to ${kitchenRoom}, ${cashierRoom}, and ${custRoom}`);
        }

        return res.status(200).json({
            success: true,
            message: "Order placed successfully",
            order: newOrder,
        });

    } catch (error) {
        console.error("Order Failed:", error);
        res.status(200).json({ success: false, message: error.message });
    }
};


export const getMyOrders = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const orders = await Order.find({ sessionId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error(error);
        res.status(200).json({ success: false, message: error.message });
    }
};

export const getAllOrders = async (req, res) => {
    try {
        const restaurantId = req.user?.restaurantId || req.query.restaurantId;

        if (!restaurantId) {
            return res.status(200).json({ success: false, message: "Restaurant ID is required to fetch orders" });
        }

        const orders = await Order.find({ restaurantId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, orders });
    } catch (error) {
        res.status(200).json({ success: false, message: error.message });
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        const updatedOrder = await Order.findByIdAndUpdate(orderId, { status }, { new: true });

        const io = req.io;
        if (io) {
            // Emit to Customer
            io.to(`session_${updatedOrder.sessionId}`).emit("order_updated", updatedOrder);

            // Emit to Staff (Kitchen & Cashier need to see status changes)
            io.to(`rest_${updatedOrder.restaurantId}_kitchen`).emit("order_updated", updatedOrder);
            io.to(`rest_${updatedOrder.restaurantId}_cashier`).emit("order_updated", updatedOrder);
        }

        res.status(200).json({ success: true, order: updatedOrder });
    } catch (error) {
        res.status(200).json({ success: false, message: error.message });
    }
};

export const requestBill = async (req, res) => {
    try {
        const { orderId } = req.params;
        const updatedOrder = await Order.findByIdAndUpdate(orderId, { status: 'bill_requested' }, { new: true });

        const io = req.io;
        if (io) {
            io.to(`rest_${updatedOrder.restaurantId}_cashier`).emit("bill_requested", updatedOrder);
            io.to(`rest_${updatedOrder.restaurantId}_kitchen`).emit("order_updated", updatedOrder); // Notify kitchen too
            io.to(`session_${updatedOrder.sessionId}`).emit("order_updated", updatedOrder);
        }

        res.status(200).json({ success: true, order: updatedOrder });
    } catch (error) {
        res.status(200).json({ success: false, message: error.message });
    }
};

export const processPayment = async (req, res) => {
    try {
        const { orderId } = req.params;
        const updatedOrder = await Order.findByIdAndUpdate(orderId, { status: 'paid' }, { new: true });

        const io = req.io;
        if (io) {
            io.to(`rest_${updatedOrder.restaurantId}_cashier`).emit("payment_received", updatedOrder);
            io.to(`session_${updatedOrder.sessionId}`).emit("order_updated", updatedOrder);
        }

        res.status(200).json({ success: true, order: updatedOrder });
    } catch (error) {
        res.status(200).json({ success: false, message: error.message });
    }
};



