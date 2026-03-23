import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { useSession } from "@/context/SessionContext";
import { toast } from "sonner";
import api from "@/services/api";
import { Order, OrderStatus } from "@/types/restaurant";

const API_URL = "/orders";

/* ---------- TYPES ---------- */

type OrderContextType = {
  orders: Order[];
  // --- ADDED: setOrders is required for manual syncing ---
  setOrders: (orders: Order[]) => void; 
  addOrder: (order: Order) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  requestBill: (orderId: string) => Promise<void>;
  payOrder: (orderId: string) => Promise<void>;
  getOrdersBySession: (sessionId: string) => Order[];
  getOrdersByStatus: (status: OrderStatus) => Order[];
  getSessionTotal: (sessionId: string) => number;
  getTotalRewardPoints: (sessionId: string) => number;
  refreshOrders: (sessionId: string) => Promise<void>;
  refreshAllOrders: () => Promise<void>;
};

/* ---------- CONTEXT ---------- */

const OrderContext = createContext<OrderContextType | undefined>(undefined);

/* ---------- PROVIDER ---------- */

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrdersState] = useState<Order[]>([]); // Renamed internal state setter
  const { socket, isConnected } = useSocket();
  const { session } = useSession();
  const { user } = useAuth();

  // Wrapper to expose setOrders safely
  const setOrders = useCallback((newOrders: Order[]) => {
      setOrdersState(newOrders);
  }, []);

  /* --- API CALLS --- */

  const refreshOrders = useCallback(async (sessionId: string) => {
    try {
      const response = await api.get(`${API_URL}/session/${sessionId}`);

      if (!response.data.success) {
        console.error("DB Error in refreshOrders:", response.data.message);
        return;
      }

      const mappedOrders = response.data.orders.map((o: any) => ({
        ...o,
        id: o.id || o._id 
      }));
      setOrdersState(mappedOrders);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
  }, []);

  const refreshAllOrders = useCallback(async () => {
    try {
      const response = await api.get(`${API_URL}/all`);

      if (!response.data.success) {
        console.error("DB Error in refreshAllOrders:", response.data.message);
        return;
      }

      const mappedOrders = response.data.orders.map((o: any) => ({
        ...o,
        id: o._id || o.id
      }));
      setOrdersState(mappedOrders);
    } catch (error) {
      console.error("Failed to fetch all orders:", error);
    }
  }, []);

  // Real-time Listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Join Rooms
    if (session.sessionId) socket.emit('join_session', session.sessionId);
    if (user?.restaurantId) {
      if (['owner', 'kitchen', 'staff', 'admin'].includes(user.role || '')) socket.emit('join_kitchen', user.restaurantId);
      if (['owner', 'cashier', 'staff', 'admin'].includes(user.role || '')) socket.emit('join_cashier', user.restaurantId);
    }

    const handleOrderCreated = (newOrder: any) => {
      setOrdersState((prev) => {
        const exists = prev.find(o => (o._id || o.id) === (newOrder._id || newOrder.id));
        if (exists) return prev;
        const mapped = { ...newOrder, id: newOrder._id || newOrder.id };
        return [mapped, ...prev];
      });
      if (['owner', 'kitchen', 'staff', 'cashier'].includes(user?.role || '')) {
        toast.info(`New Order: Table ${newOrder.tableNumber}!`);
      }
    };

    const handleOrderUpdated = (updatedOrder: any) => {
      setOrdersState((prev) =>
        prev.map(o => ((o._id || o.id) === (updatedOrder._id || updatedOrder.id))
          ? { ...updatedOrder, id: updatedOrder._id || updatedOrder.id }
          : o
        )
      );
      // Notifications logic...
      if (session.sessionId === updatedOrder.sessionId) {
        toast(`Order status: ${updatedOrder.status.toUpperCase()}`);
      }
    };

    const handleBillRequested = () => { refreshAllOrders(); };
    const handlePaymentReceived = () => { refreshAllOrders(); };

    socket.on('order_updated', handleOrderUpdated);
    socket.on('new_order_received', handleOrderCreated);
    socket.on('bill_requested', handleBillRequested);
    socket.on('payment_received', handlePaymentReceived);

    return () => {
      socket.off('order_updated', handleOrderUpdated);
      socket.off('new_order_received', handleOrderCreated);
      socket.off('bill_requested', handleBillRequested);
      socket.off('payment_received', handlePaymentReceived);
    };
  }, [socket, isConnected, session.sessionId, user, refreshAllOrders]);

  const addOrder = async (order: Order) => {
    try {
      const backendItems = order.items.map(item => ({
        itemId: item.id || item.menuItemId,
        quantity: item.quantity
      }));

      const response = await api.post(`${API_URL}/create`, {
        restaurantId: session.restaurantId,
        sessionId: order.sessionId,
        tableNumber: order.tableNumber,
        items: backendItems,
        instructions: order.instructions,
        totalAmount: order.totalAmount,
        customerPhone: order.customerPhone
      });

      if (!response.data.success) throw new Error(response.data.message);
      toast.success("Order placed successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to place order");
      throw error;
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      setOrdersState((prev) => prev.map((order) => (order.id === orderId || order._id === orderId) ? { ...order, status } : order));
      await api.post(`${API_URL}/update-status/${orderId}`, { status });
    } catch (error) {
      toast.error("Failed to update status.");
    }
  };

  const requestBill = async (orderId: string) => {
    try {
      setOrdersState((prev) => prev.map((order) => (order.id === orderId || order._id === orderId) ? { ...order, status: 'bill_requested' } : order));
      await api.post(`${API_URL}/request-bill/${orderId}`);
      toast.success("Bill requested!");
    } catch (error) {
      toast.error("Failed to request bill.");
    }
  }

  const payOrder = async (orderId: string) => {
    try {
      setOrdersState((prev) => prev.map((order) => (order.id === orderId || order._id === orderId) ? { ...order, status: 'paid' } : order));
      await api.post(`${API_URL}/pay/${orderId}`);
      toast.success("Payment confirmed!");
    } catch (error) {
      toast.error("Failed to process payment.");
    }
  }

  /* --- GETTERS (Wrapped in useCallback) --- */

  const getOrdersBySession = useCallback((sessionId: string) => 
    orders.filter((o) => o.sessionId === sessionId), 
  [orders]);

  const getOrdersByStatus = useCallback((status: OrderStatus) => 
    orders.filter((o) => o.status === status), 
  [orders]);

  const getSessionTotal = useCallback((sessionId: string) => {
    return orders
      .filter((o) => o.sessionId === sessionId)
      .reduce((sum, order) => sum + order.totalAmount, 0);
  }, [orders]);

  const getTotalRewardPoints = useCallback((sessionId: string) => {
    const totalSpent = getSessionTotal(sessionId);
    return Math.floor(totalSpent / 10);
  }, [getSessionTotal]);

  return (
    <OrderContext.Provider
      value={{
        orders,
        setOrders, // <--- Exposed here
        addOrder,
        updateOrderStatus,
        requestBill,
        payOrder,
        getOrdersBySession,
        getOrdersByStatus,
        getSessionTotal,
        getTotalRewardPoints,
        refreshOrders,
        refreshAllOrders
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

/* ---------- HOOK ---------- */

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrders must be used within OrderProvider");
  }
  return context;
};