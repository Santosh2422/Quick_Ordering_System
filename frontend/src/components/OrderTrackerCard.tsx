import React from "react";
import { CheckCircle2, Clock, ChefHat, PackageCheck, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Order, OrderStatus } from "@/types/restaurant";

interface OrderTrackerCardProps {
    order: Order;
}

const statusConfig: Record<OrderStatus, { label: string; progress: number; icon: any; color: string }> = {
    pending: { label: "Pending", progress: 5, icon: Clock, color: "text-gray-500" },
    placed: { label: "Order Placed", progress: 10, icon: Clock, color: "text-gray-500" },
    confirmed: { label: "Confirmed by Cashier", progress: 30, icon: CheckCircle2, color: "text-blue-500" },
    preparing: { label: "Cooking in Kitchen", progress: 55, icon: ChefHat, color: "text-orange-500" },
    ready: { label: "Ready to Serve", progress: 75, icon: PackageCheck, color: "text-green-500" },
    served: { label: "Served", progress: 90, icon: CheckCircle2, color: "text-green-600" },
    bill_requested: { label: "Bill Requested", progress: 95, icon: CreditCard, color: "text-purple-500" },
    paid: { label: "Paid & Completed", progress: 100, icon: CheckCircle2, color: "text-emerald-600" },
    cancelled: { label: "Cancelled", progress: 0, icon: PackageCheck, color: "text-red-500" },
};

export const OrderTrackerCard: React.FC<OrderTrackerCardProps> = ({ order }) => {
    // Safety check in case order is undefined during render cycles
    if (!order) return null;

    const currentStatus = statusConfig[order.status] || statusConfig.placed;
    const Icon = currentStatus.icon;

    // Handle ID display safely
    const displayId = order.id ? order.id.slice(-6) : '...';

    return (
        <Card className="overflow-hidden border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="bg-orange-50/50 pb-3">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-sm font-medium text-orange-800">
                            Order #{displayId}
                        </CardTitle>
                        <p className="text-xs text-orange-600 mt-0.5">
                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white ${currentStatus.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                        {currentStatus.label}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium">
                            <span>Status</span>
                            <span>{currentStatus.progress}%</span>
                        </div>
                        <Progress value={currentStatus.progress} className="h-2 bg-orange-100 [&>div]:bg-orange-500" />
                    </div>

                    <div className="divide-y divide-orange-50">
                        {/* FIX: Added 'index' to the map function 
                           and used a composite key `${item.id}-${index}` 
                           to guarantee uniqueness.
                        */}
                        {order.items.map((item, index) => (
                            <div key={`${item.id || 'unknown'}-${index}`} className="py-2 flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">
                                    <span className="font-semibold text-foreground">{item.quantity}x</span> {item.name}
                                </span>
                                <span className="font-medium">₹{item.price * item.quantity}</span>
                            </div>
                        ))}
                    </div>

                    <div className="pt-2 flex justify-between items-center font-bold text-orange-950">
                        <span>Total Amount</span>
                        <span>₹{order.totalAmount}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};