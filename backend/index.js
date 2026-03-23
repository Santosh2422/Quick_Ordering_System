import express from 'express';
import cors from 'cors'
import cookieParser from 'cookie-parser'
import mongoose from 'mongoose';
import { connectDB } from './additionals/mongo_connection.js';
import { config } from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import qrRoutes from './routes/qr.route.js'
import authRoutes from './routes/auth.route.js'
import refreshTokenRoutes from './routes/refresh.routes.js'
import restaurantRoutes from './routes/restaurant.routes.js'
import restRoutes from './routes/rest.routes.js'
import staffRoutes from './routes/staff.route.js'
import orderRoutes from './routes/order.routes.js'
import sessionRoutes from './routes/session.routes.js'
import adminRoutes from './routes/admin.route.js'
import analyticsRoutes from './routes/analytics.route.js'

// Load environment variables FIRST
config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5001; // Match common port

app.set("trust proxy", 1);

const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? [process.env.FRONTEND_URL]
    : [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
      ];


const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        credentials: true
    }
});

app.use(cookieParser());
app.use(express.json());

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}))

// Make io available in routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Middleware: Database Health Guard
// Prevents hangs and returns 200 with error message if DB is disconnected
app.use((req, res, next) => {
    const states = ["Disconnected", "Connected", "Connecting", "Disconnecting"];
    const currentState = states[mongoose.connection.readyState] || "Unknown";
    const isDBReady = mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2;

    console.log(`[DB Monitor] ${req.method} ${req.path} | Status: ${currentState}`);

    if (!isDBReady &&
        req.path.startsWith('/api') &&
        !req.path.includes('/refresh') &&
        !req.path.includes('/auth/logout') &&
        !req.path.includes('/health')
    ) {
        return res.status(200).json({
            success: false,
            message: `Service Unavailable: Database is ${currentState.toLowerCase()}.`,
            isDbError: true,
            requestedPath: req.path
        });
    }
    next();
});

// Socket.io connection handler
io.on('connection', (socket) => {
    console.log('🔌 SOCKET CONNECTED: ' + socket.id);

    // Dynamic Room Joiner (Safer)
    socket.on('join_room', (roomName) => {
        socket.join(roomName);
        console.log(`👤 Socket ${socket.id} joined custom room: ${roomName}`);
    });

    socket.on('join_session', (sessionId) => {
        const room = `session_${sessionId}`;
        socket.join(room);
        console.log(`📁 Socket ${socket.id} joined session room: ${room}`);
    });

    socket.on('join_kitchen', (restaurantId) => {
        const room = `rest_${restaurantId}_kitchen`;
        socket.join(room);
        console.log(`👨‍🍳 Socket ${socket.id} joined KITCHEN room: ${room}`);
        console.log('Active Rooms:', Array.from(socket.rooms));
    });

    socket.on('join_cashier', (restaurantId) => {
        const room = `rest_${restaurantId}_cashier`;
        socket.join(room);
        console.log(`💰 Socket ${socket.id} joined CASHIER room: ${room}`);
        console.log('Active Rooms:', Array.from(socket.rooms));
    });

    socket.on('disconnect', (reason) => {
        console.log(`🔌 SOCKET DISCONNECTED: ${socket.id} | Reason: ${reason}`);
    });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/qr", qrRoutes);
app.use("/api/refresh", refreshTokenRoutes);
app.use("/api/menu", restaurantRoutes);
app.use("/api/rest", restRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/session", sessionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/analytics", analyticsRoutes);

// Health Check Endpoint
app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "alive",
        database: {
            state: mongoose.connection.readyState,
            stateName: ["disconnected", "connected", "connecting", "disconnecting"][mongoose.connection.readyState],
            host: mongoose.connection.host || "none"
        },
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});


// Global Error Handler - Force 200 status for UI stability
app.use((err, req, res, next) => {
    console.error("GLOBAL ERROR:", err.stack);
    res.status(200).json({
        success: false,
        message: err.message || "Internal Server Error",
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

const startServer = async () => {
    // Start listening and handle errors (like port in use)
    // Attempt DB connection in background
    try {
        await connectDB();
    } catch (err) {
        console.error("❌ [DB Check] Delayed connection failed:", err.message);
    }

    httpServer.listen(PORT, () => {
        console.log(`🚀 [Server] Running on port ${PORT}`);

    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`❌ [Critical] Port ${PORT} is already in use. Please close the other process or change the PORT in .env.`);
        } else {
            console.error(`❌ [Critical] Server error:`, err);
        }
        process.exit(1);
    });
};

startServer();