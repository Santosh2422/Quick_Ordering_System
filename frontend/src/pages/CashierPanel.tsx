import { useEffect, useState } from "react";
import { 
  Home, 
  CheckCircle2, 
  Receipt, 
  LogOut, 
  KeyRound, 
  Loader2, 
  Store, 
  User, 
  DollarSign,
  ClipboardList 
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import { useOrders } from "@/context/OrderContext";
import { useAuth } from "@/context/AuthContext"; 
import { changePasswordApi } from "@/services/auth.service";
import { getRestaurantById } from "@/services/restaurant.service"; 
import api from "@/services/api"; 
import { Order } from "@/types/restaurant";

const CashierPanel = () => {
  const { orders, refreshAllOrders, updateOrderStatus } = useOrders();
  const { logout, user } = useAuth(); 
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState<any>(null);
  const [loadingRestaurant, setLoadingRestaurant] = useState(false);

  // --- BILLING STATE ---
  const [selectedSession, setSelectedSession] = useState<{sessionId: string, tableNumber: string} | null>(null);
  const [isBillingOpen, setIsBillingOpen] = useState(false);

  // 1. Fetch Restaurant Details
  useEffect(() => {
    const fetchRestaurantDetails = async () => {
      if (user?.restaurantId) {
        try {
          setLoadingRestaurant(true);
          const res = await getRestaurantById();
          setRestaurant(res.data.restaurant); 
        } catch (error) {
          console.error("Failed to fetch restaurant details", error);
          toast.error("Could not load restaurant details.");
        } finally {
          setLoadingRestaurant(false);
        }
      }
    };
    fetchRestaurantDetails();
  }, [user?.restaurantId]);

  // 2. Poll for Orders
  useEffect(() => {
    refreshAllOrders();
    const interval = setInterval(refreshAllOrders, 30000); 
    return () => clearInterval(interval);
  }, []);

  // --- FILTERING ---
  const incomingOrders = orders.filter(o => o.status === 'placed');
  
  const billableOrders = orders.filter(o => 
    ['served', 'bill_requested', 'ready'].includes(o.status) 
    && o.status !== 'paid' 
    && o.status !== 'cancelled'
  );

  const handleOpenBilling = (sessionId: string, tableNumber: string) => {
    setSelectedSession({ sessionId, tableNumber });
    setIsBillingOpen(true);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 text-foreground pb-20">
      
      {/* HEADER */}
      <header className="border-b bg-white shadow-sm sticky top-0 z-10">
        <div className="container py-3 flex items-center justify-between px-6">
          
          {/* Left: Restaurant Details */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 border border-orange-200 flex items-center justify-center overflow-hidden relative">
               {loadingRestaurant ? (
                 <Loader2 className="w-5 h-5 text-orange-600 animate-spin" />
               ) : restaurant?.image ? (
                 <img src={restaurant.image} alt="Logo" className="w-full h-full object-cover" />
               ) : (
                 <Store className="w-5 h-5 text-orange-600" />
               )}
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight text-gray-900">
                {restaurant?.name || "Restaurant Panel"}
              </h1>
              <Badge variant="outline" className="text-[10px] bg-orange-50 text-orange-700">Cashier Dashboard</Badge>
            </div>
          </div>

          {/* Right: User Info & Actions */}
          <div className="flex items-center gap-4">
            
            {/* User Details (Same CSS as Kitchen Panel) */}
            <div className="hidden md:flex flex-col items-end border-r pr-4 border-gray-200 text-right">
               <span className="text-sm font-semibold text-gray-800">
                 {user?.name || "Cashier Staff"}
               </span>
               <div className="flex items-center gap-1 text-xs text-muted-foreground capitalize">
                  <User className="w-3 h-3" />
                  {user?.role || "Cashier"}
               </div>
            </div>

            <div className="flex items-center gap-2">
              <Link to="/">
                <Button size="sm" variant="ghost" className="hidden lg:flex">
                  <Home className="w-4 h-4 mr-2" /> Home
                </Button>
              </Link>
              <ChangePasswordDialog />
              <Button variant="destructive" size="sm" onClick={handleLogout} className="gap-2">
                  <LogOut className="w-4 h-4" /> <span className="hidden md:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="container py-6 px-6">
        <Tabs defaultValue="incoming">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="incoming">
              Incoming Orders
              {incomingOrders.length > 0 && <Badge className="ml-2 bg-orange-500">{incomingOrders.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="bills">
              Billing & Settlements
              {billableOrders.length > 0 && <Badge className="ml-2 bg-green-500">{new Set(billableOrders.map(o => o.sessionId)).size}</Badge>}
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: INCOMING */}
          <TabsContent value="incoming">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {incomingOrders.map((order) => (
                <Card key={order.id} className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-lg">Order #{order.id.slice(-4)}</p>
                        <p className="text-sm text-muted-foreground">
                          Table: {order.tableNumber}
                          {order.customerPhone && <span className="text-orange-600 font-medium ml-2">📞 {order.customerPhone}</span>}
                        </p>
                      </div>
                      <Badge variant="outline">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Badge>
                    </div>
                    <div className="space-y-1 my-3 text-sm">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{item.quantity}x {item.name}</span>
                          <span className="font-semibold">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {/* INSTRUCTIONS DISPLAY */}
                    {order.instructions && (
                      <div className="mt-2 mb-3 p-2 bg-amber-50 border border-amber-100 rounded-md">
                        <div className="flex items-center gap-1.5 mb-1">
                          <ClipboardList className="w-3.5 h-3.5 text-amber-700" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Note</span>
                        </div>
                        <p className="text-xs font-semibold text-amber-950 leading-tight italic">
                          {order.instructions}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between items-center font-bold text-lg mb-3 pt-2 border-t">
                      <span>Total:</span>
                      <span className="text-orange-600">₹{order.totalAmount}</span>
                    </div>
                    <Button 
                      className="w-full mt-2 bg-orange-500 hover:bg-orange-600" 
                      onClick={() => updateOrderStatus(order.id, "confirmed")}
                    >
                      ✅ Confirm & Send to Kitchen
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {incomingOrders.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground bg-white rounded-xl border border-dashed">
                    <p>No new orders pending confirmation.</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* TAB 2: BILLING */}
          <TabsContent value="bills">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from(new Set(billableOrders.map(o => o.sessionId))).map(sessionId => {
                 const sessionOrders = billableOrders.filter(o => o.sessionId === sessionId);
                 if (sessionOrders.length === 0) return null;

                 const firstOrder = sessionOrders[0];
                 const totalDue = sessionOrders.reduce((sum, o) => sum + o.totalAmount, 0);
                 const hasBillRequest = sessionOrders.some(o => o.status === 'bill_requested');

                 return (
                    <Card key={sessionId} className={`border-l-4 shadow-sm hover:shadow-md transition-shadow ${hasBillRequest ? 'border-l-red-500 bg-red-50/10' : 'border-l-green-500'}`}>
                       <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                             <div>
                                <CardTitle className="text-xl font-bold">Table {firstOrder.tableNumber}</CardTitle>
                                {hasBillRequest && <Badge variant="destructive" className="mt-1 animate-pulse">Bill Requested</Badge>}
                             </div>
                             <div className="text-right">
                                <span className="block text-2xl font-black text-green-700">₹{totalDue}</span>
                                <span className="text-xs text-muted-foreground">{sessionOrders.length} Orders</span>
                             </div>
                          </div>
                       </CardHeader>
                       <CardContent>
                          <Button 
                            className="w-full bg-green-600 hover:bg-green-700 gap-2"
                            onClick={() => handleOpenBilling(sessionId, firstOrder.tableNumber)}
                          >
                             <Receipt className="w-4 h-4" /> Generate Final Bill
                          </Button>
                       </CardContent>
                    </Card>
                 )
              })}

              {billableOrders.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground bg-white rounded-xl border border-dashed">
                    <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No active tables waiting for billing.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* --- BILLING DIALOG --- */}
      {selectedSession && (
        <BillingDialog 
            open={isBillingOpen} 
            onOpenChange={setIsBillingOpen}
            sessionId={selectedSession.sessionId}
            tableNumber={selectedSession.tableNumber}
            allOrders={orders}
            onSettle={() => {
                refreshAllOrders(); 
                setIsBillingOpen(false);
                setSelectedSession(null);
            }}
        />
      )}

    </div>
  );
};

// --- BILLING DIALOG COMPONENT ---
const BillingDialog = ({ open, onOpenChange, sessionId, tableNumber, allOrders, onSettle }: any) => {
    const [loading, setLoading] = useState(false);

    const billableOrders = allOrders.filter((o: Order) => 
        o.sessionId === sessionId && 
        o.status !== 'cancelled' && 
        o.status !== 'paid'
    );

    const totalAmount = billableOrders.reduce((sum: number, o: Order) => sum + o.totalAmount, 0);

    const handleSettleBill = async () => {
        if (!confirm(`Confirm payment of ₹${totalAmount} for Table ${tableNumber}?`)) return;
        
        try {
            setLoading(true);
            await api.post(`/session/close/${sessionId}`, { 
                totalAmount: totalAmount,
                paymentMethod: "cash" 
            }); 

            toast.success(`Table ${tableNumber} Settled! 💸`);
            onSettle(); 
        } catch (error: any) {
            console.error("Billing failed", error);
            toast.error(error.response?.data?.message || "Failed to settle bill");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Receipt className="w-5 h-5 text-green-600" />
                        Final Bill - Table {tableNumber}
                    </DialogTitle>
                    <DialogDescription>
                        Consolidated bill for all orders.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto">
                    {billableOrders.map((order: Order) => (
                        <div key={order.id} className="bg-gray-50 p-3 rounded-lg border text-sm">
                            <div className="flex justify-between font-semibold mb-1 text-gray-700">
                                <span>Order #{order.id.toString().slice(-4)}</span>
                                <Badge variant="outline" className="bg-white text-xs">{order.status}</Badge>
                            </div>
                            <div className="space-y-1 pl-2 border-l-2 border-gray-300">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-gray-500">
                                        <span>{item.quantity} x {item.name}</span>
                                        <span>₹{item.price * item.quantity}</span>
                                    </div>
                                ))}
                            </div>
                            
                            {/* INSTRUCTIONS IN BILL SUMMARY */}
                            {order.instructions && (
                                <div className="mt-2 p-1.5 bg-amber-100/50 rounded border border-amber-200 flex items-start gap-2">
                                    <ClipboardList className="w-3.5 h-3.5 text-amber-700 mt-0.5 shrink-0" />
                                    <p className="text-[11px] text-amber-900 leading-tight italic">
                                        {order.instructions}
                                    </p>
                                </div>
                            )}

                            <div className="text-right font-bold mt-1">₹{order.totalAmount}</div>
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-between border-t pt-4 bg-green-50/50 p-3 rounded-lg">
                    <span className="text-lg font-bold text-gray-800">Grand Total</span>
                    <span className="text-2xl font-black text-green-700">₹{totalAmount}</span>
                </div>

                <DialogFooter className="gap-2 sm:gap-0 mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button 
                        onClick={handleSettleBill} 
                        disabled={loading || billableOrders.length === 0}
                        className="bg-green-600 hover:bg-green-700 gap-2 w-full sm:w-auto"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                        Confirm Payment & Close Table
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// --- CHANGE PASSWORD DIALOG ---
const ChangePasswordDialog = () => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }
        try {
            setLoading(true);
            const res = await changePasswordApi({
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword
            });

            if (res.data.success) {
                toast.success("Password updated successfully");
                setOpen(false);
                setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <KeyRound className="w-4 h-4" />
                    <span className="hidden md:inline">Change Password</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>Update your account password securely.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input id="currentPassword" name="currentPassword" type="password" value={formData.currentPassword} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input id="newPassword" name="newPassword" type="password" value={formData.newPassword} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Update Password
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CashierPanel;