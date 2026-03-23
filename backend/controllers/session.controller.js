import Session from "../models/session.model.js";
import Order from "../models/orders.model.js"; // Import Order model
import qrTable from "../models/qr.model.js"; // Import QR Table model

export const startSession = async (req, res) => {
    try {
        const { restaurantId, tableNumber } = req.body;

        if (!restaurantId || !tableNumber) {
            return res.status(200).json({ success: false, message: "Missing restaurant or table information" });
        }

        // 0. LOOKUP TABLE: Find the table to get the human-readable name
        // Try looking up by tableShortId first
        let table = await qrTable.findOne({
            restaurantId,
            tableShortId: tableNumber
        });

        // 0.1 Fallback: Try looking up by _id in case tableNumber is an ObjectID
        // Convert to string to ensure .match works
        const tableNumStr = String(tableNumber);
        if (!table && tableNumStr.match(/^[0-9a-fA-F]{24}$/)) {
            table = await qrTable.findOne({
                restaurantId,
                _id: tableNumber
            });
        }

        if (!table) {
            console.log(`[Session] Table not found for Rest: ${restaurantId}, TableNum: ${tableNumber}`);
            return res.status(200).json({
                success: false,
                message: "Table not found. Please scan a valid QR code."
            });
        }

        // 1. SMART CHECK: Look for an existing OPEN session for this table
        // We now use table.tableName (human-readable) in the database records
        let session = await Session.findOne({
            restaurantId,
            tableNumber: table.tableName,
            status: 'active'
        });

        // 2. If found, return it (Restores context for user)
        if (session) {
            return res.status(200).json({
                success: true,
                message: "Session restored",
                session: session, // Return full session object
                tableName: table.tableName,
                isNew: false
            });
        }

        // 3. If not found, create a NEW one
        session = await Session.create({
            restaurantId,
            tableNumber: table.tableName,
            status: 'active'
        });

        return res.status(200).json({
            success: true,
            message: "Session started",
            session: session, // Return full session object
            tableName: table.tableName,
            isNew: true
        });

    } catch (error) {
        console.error("error in Creating Session:", error);
        return res.status(200).json({
            success: false,
            error: error.message,
            message: `Error in Creating Session: ${error.message}`
        });
    }
};




export const closeSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        // You can optionally pass paymentMethod from frontend (e.g., 'cash', 'upi')
        const { paymentMethod, totalAmount } = req.body;
        // 1. Find all VALID orders for this session (ignore cancelled ones)
        const sessionOrders = await Order.find({
            sessionId: sessionId,
            status: 'served'
        });

        // 2. Calculate the Grand Total
        const calculatedTotal = sessionOrders.reduce((sum, order) => {
            return sum + (order.totalAmount || 0);
        }, 0);
        if (calculatedTotal !== totalAmount) {
            return res.status(200).json({ success: false, message: "Amount didnt match" })
        }

        const session = await Session.findByIdAndUpdate(
            sessionId,
            {
                status: 'closed',
                totalAmount: calculatedTotal, // <--- UPDATING TOTAL HERE
                endTime: new Date(),
                paymentMethod: paymentMethod || 'cash' // Default to cash if not provided
            },
            { new: true }
        );
        const io = req.io;
        if (io) {
            const roomName = `session_${sessionId}`;
            const clients = io.sockets.adapter.rooms.get(roomName);
            
            console.log(`📡 Emitting to: ${roomName}`);
            // Check if the customer's socket is actually "in" the room
            console.log(`👥 Active listeners: ${clients ? clients.size : 0}`);

            io.to(roomName).emit("session_closed", { sessionId });
        }

        if (!session) {
            return res.status(200).json({ success: false, message: "Session not found" });
        }

        // OPTIONAL: Mark all orders as 'paid' simultaneously to keep DB consistent
        await Order.updateMany(
            { sessionId: sessionId, status: 'served' },
            { $set: { status: 'paid' } }
        );

        return res.status(200).json({
            success: true,
            message: `Session closed. Total Revenue: ₹${calculatedTotal}`,
            session
        });

    } catch (error) {
        console.error("Error closing session:", error);
        return res.status(200).json({ success: false, message: "Internal Server Error" });
    }
};