import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
    restaurantId: String,
    tableNumber: String,
    status: { type: String, enum: ['active', 'closed'], default: 'active' },
    paymentMethod: { type: String, enum: ['upi', 'cash', 'card'] },
    totalAmount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    endTime: { type: Date }
});

const Session = mongoose.model('Session', sessionSchema);
export default Session;