import Order from "../models/orders.model.js";

export const generateBill = async (req, res) => {
    try {
        const { orderId } = req.params;
        // Logic to calculate final bill, tax, etc.
        // For now, simple return
        const order = await Order.findById(orderId);
        if (!order) return res.status(200).json({ success: false, message: "Order not found" });

        res.status(200).json({
            success: true,
            message: "Bill generated",
            data: {
                total: order.totalAmount,
                tax: order.totalAmount * 0.05,
                grandTotal: order.totalAmount * 1.05
            }
        });

    } catch (error) {
        console.log("Error in bill controller:", error.message);
        res.status(200).json({ success: false, message: "Internal Server Error" });
    }
};