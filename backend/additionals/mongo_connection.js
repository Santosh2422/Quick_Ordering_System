import { config } from "dotenv";
import mongoose from "mongoose"
config();

export const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            console.error("CRITICAL: MONGODB_URI is not defined in .env!");
            return;
        }

        const maskedUri = uri.replace(/\/\/.*@/, "//****:****@");
        console.log(`Attempting to connect to: ${maskedUri}`);

        // Listen for connection events (Register ONCE)
        if (mongoose.connection.listeners('connected').length === 0) {
            mongoose.connection.on('connected', () => {
                console.log('✅ MongoDB Connected');
            });

            mongoose.connection.on('error', (err) => {
                console.error('❌ MongoDB Connection Error:', err.message);
            });

            mongoose.connection.on('disconnected', () => {
                console.warn('⚠️ MongoDB Disconnected. Attempting to reconnect...');
            });
        }

        const options = {
            serverSelectionTimeoutMS: 30000,
            heartbeatFrequencyMS: 10000,
            socketTimeoutMS: 45000,
            family: 4
        };

        const conn = await mongoose.connect(uri, options);
        console.log(`DataBase Connected Successfully ${conn.connection.host}`);
        console.log("MongoDB connected to Atlas successfully");
    } catch (error) {
        console.error("CRITICAL: MongoDB connection failed!");
        console.error("Error Detail:", error.message);

        console.log("Retrying connection in 5 seconds...");
        setTimeout(connectDB, 5000);
    }
}