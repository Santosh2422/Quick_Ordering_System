import React, { useMemo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, History, CreditCard, ShoppingBag, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useOrders } from "@/context/OrderContext";
import { useSession } from "@/context/SessionContext";
import { OrderTrackerCard } from "@/components/OrderTrackerCard";
import { RestaurantLogo } from "@/components/RestaurantLogo";
import { toast } from "sonner";

const CustomerOrders: React.FC = () => {
    const navigate = useNavigate();
    const { session } = useSession();

    // Get refreshOrders from context
    const {
        getOrdersBySession,
        getSessionTotal,
        refreshOrders, // <--- This is the key function
        orders
    } = useOrders();

    const [isLoading, setIsLoading] = useState(true);
    const [isRefetching, setIsRefetching] = useState(false);

    // --- EFFECT: SYNC ON LOAD ---
    useEffect(() => {
        const syncData = async () => {
            if (!session.sessionId) {
                setIsLoading(false);
                return;
            }

            // Only fetch if we don't have orders (or strictly force it on mount)
            // We force it here to ensure we get the latest status updates
            try {
                await refreshOrders(session.sessionId);
            } catch (error) {
                console.error("Sync failed");
            } finally {
                setIsLoading(false);
            }
        };

        syncData();
    }, [session.sessionId, refreshOrders]);

    // --- MANUAL REFRESH HANDLER ---
    const handleManualRefresh = async () => {
        if (!session.sessionId) return;
        setIsRefetching(true);
        await refreshOrders(session.sessionId);
        toast.success("Orders updated!");
        setTimeout(() => setIsRefetching(false), 500);
    };

    // --- MEMOIZED DATA ---
    const sessionOrders = useMemo(() => {
        if (!session.sessionId) return [];
        // Use the raw orders from context if getOrdersBySession returns empty initially
        return getOrdersBySession(session.sessionId).sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }, [session.sessionId, getOrdersBySession, orders]); // Add 'orders' as dependency

    const totalSpent = useMemo(() => {
        if (!session.sessionId) return 0;
        return getSessionTotal(session.sessionId);
    }, [session.sessionId, getSessionTotal, sessionOrders]);

    const activeOrders = sessionOrders.filter(o => o.status !== "paid" && o.status !== "cancelled");
    const pastOrders = sessionOrders.filter(o => o.status === "paid" || o.status === "cancelled");

    // --- LOADING STATE ---
    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-orange-50/30">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                <p className="text-orange-800 mt-2 font-medium">Loading your orders...</p>
            </div>
        );
    }

    // --- NO SESSION STATE ---
    if (!session.sessionId) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-orange-50/30 text-center">
                <ShoppingBag className="w-16 h-16 text-orange-200 mb-4" />
                <h2 className="text-xl font-bold text-orange-950">No Active Session</h2>
                <p className="text-orange-600/80 mb-6 max-w-xs mx-auto">Scan a QR code to start ordering or view your current session.</p>
                <Button onClick={() => navigate("/scan-table")} className="bg-orange-500 hover:bg-orange-600">
                    Scan QR Code
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-orange-50/30 pb-24">
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-orange-100">
                <div className="container py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate("/menu")}
                            className="text-orange-600 bg-orange-50 hover:bg-orange-100"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <h1 className="text-lg font-bold text-orange-950">My Orders</h1>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleManualRefresh}
                            className={`${isRefetching ? "animate-spin" : ""} text-orange-400`}
                        >
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                        <RestaurantLogo size="sm" showText={false} />
                    </div>
                </div>
            </header>

            <main className="container py-6 space-y-6">
                {/* Active Orders */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                            <h2 className="font-bold text-orange-950">Active Orders</h2>
                        </div>
                        <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                            ₹{totalSpent}
                        </span>
                    </div>

                    {activeOrders.length > 0 ? (
                        <div className="grid gap-4">
                            {activeOrders.map((order, index) => (
                                <OrderTrackerCard
                                    // Fallback key strategy to prevent React warnings
                                    key={order._id || order.id || index}
                                    order={order}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-orange-200">
                            <ShoppingBag className="w-12 h-12 text-orange-100 mx-auto mb-3" />
                            <p className="text-sm text-orange-600 italic">No active orders found.</p>
                            <Button variant="link" onClick={() => navigate("/menu")} className="text-orange-500 font-bold mt-2">
                                Order something delicious
                            </Button>
                        </div>
                    )}
                </section>

                {/* Order History */}
                {pastOrders.length > 0 && (
                    <section className="space-y-4 pt-4 border-t border-orange-100/50">
                        <div className="flex items-center gap-2 px-1">
                            <History className="w-4 h-4 text-orange-400" />
                            <h2 className="font-bold text-orange-950">Past Orders</h2>
                        </div>
                        <div className="grid gap-4 opacity-80">
                            {pastOrders.map((order, index) => (
                                <OrderTrackerCard
                                    key={order._id || order.id || `past-${index}`}
                                    order={order}
                                />
                            ))}
                        </div>
                    </section>
                )}
            </main>

            <div className="fixed bottom-6 right-6 z-50">
                <Button
                    onClick={() => navigate("/menu")}
                    className="rounded-full h-14 w-14 shadow-xl bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center"
                >
                    <ShoppingBag className="w-6 h-6" />
                </Button>
            </div>
        </div>
    );
};

export default CustomerOrders;