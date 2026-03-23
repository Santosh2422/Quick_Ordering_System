import mongoose from "mongoose";
import Session from "./session.model.js";
import Restaurant from "./restaurants.model.js";

const orderItemSchema = new mongoose.Schema({
    menuItemId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true }
});

const orderSchema = new mongoose.Schema({
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Session"
    },

    // 1. LINKING CONFIGURATION
    // We keep this as String because your Restaurant 'uid' is a String.
    // We DO NOT add 'ref: Restaurant' here directly because that defaults to looking for _id.
    restaurantId: {
        type: String, 
        required: true,
        index: true 
    },

    tableNumber: { type: String, required: true },
    customerPhone: { type: String },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true },
    instructions: { type: String, required: false },
    status: {
        type: String,
        enum: ["placed", "confirmed", "preparing", "ready", "served", "bill_requested", "paid", "cancelled"],
        default: "placed",
        index: true
    },
}, { 
    timestamps: true,
    // 2. ENABLE VIRTUALS
    // This ensures that when you fetch an order, you can populate the restaurant details
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// 3. CREATE THE VIRTUAL RELATIONSHIP
// This tells Mongoose: "Look at the 'Restaurant' model. Find the document where
// Restaurant.uid matches Order.restaurantId"
orderSchema.virtual('restaurantDetails', {
    ref: 'Restaurant',          // The Model to look up
    localField: 'restaurantId', // The field in this (Order) schema
    foreignField: 'uid',        // The field in the Restaurant schema to match against
    justOne: true               // We only expect one restaurant per ID
});

const Order = mongoose.model("Order", orderSchema);
export default Order;