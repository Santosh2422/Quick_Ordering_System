import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { startSessionApi } from "@/services/session.service";
import { useSocket } from "@/context/SocketContext";

export type SessionStatus = "IDLE" | "CREATED" | "ACTIVE" | "BILL_REQUESTED" | "PAID" | "CLOSED";

export interface SessionState {
  sessionId: string | null;
  tableId: string | null;
  tableName: string | null;
  restaurantId: string | null;
  status: SessionStatus;
  restaurantDetails?: { name: string; image?: string } | null;
}

const DEFAULT_SESSION: SessionState = {
  sessionId: null,
  tableId: null,
  tableName: null,
  restaurantId: null,
  status: "IDLE",
  restaurantDetails: null,
};

interface SessionContextType {
  session: SessionState;
  startNewSession: (restaurantId: string, tableNumber: string) => Promise<any>;
  resetSession: () => void;
  customerPhone: string | null;
  setCustomerPhone: (phone: string) => void;
  clearCustomerPhone: () => void;
  updateSession: (data: Partial<SessionState>) => void;
  isLoading: boolean;
  error: string | null;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { socket } = useSocket();
  const isResettingRef = useRef(false);

  // --- 1. INITIAL STATE ---
  const [session, setSession] = useState<SessionState>(() => {
    try {
      const saved = localStorage.getItem("session");
      if (saved) return JSON.parse(saved);
    } catch { }
    return DEFAULT_SESSION;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerPhone, setCustomerPhoneState] = useState<string | null>(() => localStorage.getItem("customerPhone"));

  // --- 2. PERSISTENCE LAYER ---
  useEffect(() => {
    if (isResettingRef.current) return;
    if (session.sessionId) {
      localStorage.setItem("session", JSON.stringify(session));
    } else {
      localStorage.removeItem("session");
    }
  }, [session]);

  // --- 3. SOCKET LISTENER (THE "NUKE" TRIGGER) ---
  useEffect(() => {
    if (!socket || !session.sessionId) return;

    // Join the specific session room
    socket.emit("join_session", session.sessionId);
    console.log(`📁 Joined Socket Room: session_${session.sessionId}`);

    const handleSessionClosed = (data: any) => {
      console.log("🚨 Payment confirmed by cashier. Closing session...", data);
      
      toast.success("Payment Received! Thank you for dining with us.", {
        duration: 3000,
      });

      // Small delay so user can see the success toast before redirect
      setTimeout(() => {
        resetSession();
      }, 2000);
    };

    // Listen for the event emitted by your closeSession controller
    socket.on("session_closed", handleSessionClosed);

    // Re-join room if socket reconnects (important for mobile sleep mode)
    socket.on("connect", () => {
      if (session.sessionId) {
        socket.emit("join_session", session.sessionId);
      }
    });

    return () => {
      socket.off("session_closed", handleSessionClosed);
      socket.off("connect");
    };
  }, [socket, session.sessionId]);

  // --- 4. ACTION HANDLERS ---
  const startNewSession = async (restaurantId: string, tableNumber: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await startSessionApi(restaurantId, tableNumber);
      if (!res.data.success) throw new Error(res.data.message || "Failed to start session");

      const { session: sessionData, tableName } = res.data;
      const newSession: SessionState = {
        sessionId: sessionData._id,
        restaurantId,
        tableId: tableNumber,
        tableName: tableName || null,
        status: "ACTIVE",
        restaurantDetails: session.restaurantDetails
      };
      
      setSession(newSession);
      return res.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateSession = (data: Partial<SessionState>) => {
    setSession((prev) => ({ ...prev, ...data }));
  };

  const resetSession = () => {
    isResettingRef.current = true;
    //localStorage.clear(); // Clear all: session, cart, and phone
    localStorage.removeItem("session"); 
    localStorage.removeItem("cart"); // or your specific cart key
    localStorage.removeItem("customerPhone");
    setSession(DEFAULT_SESSION);
    
    // Hard redirect to home to clear all context states
    window.location.replace("/");
  };

  return (
    <SessionContext.Provider 
      value={{ 
        session, 
        startNewSession, 
        updateSession, 
        resetSession, 
        customerPhone, 
        setCustomerPhone: (phone) => {
          localStorage.setItem("customerPhone", phone);
          setCustomerPhoneState(phone);
        }, 
        clearCustomerPhone: () => {
          localStorage.removeItem("customerPhone");
          setCustomerPhoneState(null);
        }, 
        isLoading, 
        error 
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within a SessionProvider");
  return ctx;
};