import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

interface SocketProviderProps {
    children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = React.useRef<Socket | null>(null);

    useEffect(() => {
        // Prevent double initialization
        if (socketRef.current) {
            console.log('ℹ️ Socket already initialized, skipping...');
            return;
        }

        console.log('🔌 Connecting to socket server at:', SOCKET_URL);

        const socketInstance = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['websocket'], // Prioritize websocket for stability
            autoConnect: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
        });

        socketRef.current = socketInstance;

        socketInstance.on('connect', () => {
            console.log('✅ Socket connected! ID:', socketInstance.id);
            setIsConnected(true);
            toast.success("Real-time updates active");
        });

        socketInstance.on('disconnect', (reason) => {
            console.warn('❌ Socket disconnected:', reason);
            setIsConnected(false);

            // Reconnect if server-side disconnect
            if (reason === "io server disconnect") {
                socketInstance.connect();
            }
        });

        socketInstance.on('connect_error', (err) => {
            console.error('🔴 Socket error:', err.message);
            // Don't toast on every error to avoid spam, but log it
        });

        setSocket(socketInstance);

        // CLEANUP: Only disconnect if the component is truly unmounting
        // We avoid the timeout hack which was causing the "client namespace disconnect" loop
        return () => {
            console.log('🔌 Effect cleanup: Socket remains active unless app-wide unmount');
            // In a global provider, we typically want the socket to live for the session
            // socketInstance.disconnect(); // Only enable if this isn't a global provider
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
