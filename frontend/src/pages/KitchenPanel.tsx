import { useEffect, useState } from "react";
import { 
  ChefHat, 
  Clock, 
  Flame, 
  LogOut, 
  KeyRound, 
  Loader2, 
  Store, 
  User,
  ClipboardList // Added for instructions icon
} from "lucide-react"; 
import { toast } from "sonner";
import { useNavigate } from "react-router-dom"; 

// UI Components
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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

// Services & Context
import { changePasswordApi } from "@/services/auth.service";
import { getRestaurantById } from "@/services/restaurant.service"; 
import { useOrders } from "@/context/OrderContext";
import { useAuth } from "@/context/AuthContext"; 
import { Order } from "@/types/restaurant";

const KitchenPanel = () => {
  const { orders, refreshAllOrders, updateOrderStatus } = useOrders();
  const { logout, user } = useAuth(); 
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState<any>(null);
  const [loadingRestaurant, setLoadingRestaurant] = useState(false);

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

  useEffect(() => {
    refreshAllOrders();
    const interval = setInterval(refreshAllOrders, 30000); 
    return () => clearInterval(interval);
  }, []);

  const kitchenOrders = orders.filter(o => ["confirmed", "preparing", "ready"].includes(o.status));
  const confirmedOrders = kitchenOrders.filter((o) => o.status === "confirmed");
  const preparingOrders = kitchenOrders.filter((o) => o.status === "preparing");
  const readyOrders = kitchenOrders.filter((o) => o.status === "ready");

  const startCooking = async (orderId: string) => {
    await updateOrderStatus(orderId, "preparing");
    toast.success("Order moved to cooking 🍳");
  };

  const markReady = async (orderId: string) => {
    await updateOrderStatus(orderId, "ready");
    toast.success("Order marked ready! ✅");
  };

  const markServed = async (orderId: string) => {
    await updateOrderStatus(orderId, "served");
    toast.success("Order marked served! 🍽️");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background text-foreground bg-gray-50">
      {/* HEADER */}
      <header className="border-b bg-white shadow-sm sticky top-0 z-10">
        <div className="container py-3 flex items-center justify-between">
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
            
            <div className="flex flex-col">
              {loadingRestaurant ? (
                <div className="h-5 w-32 bg-gray-200 animate-pulse rounded mb-1"></div>
              ) : (
                <h1 className="font-bold text-lg leading-tight text-gray-900">
                  {restaurant?.name || "Kitchen Panel"}
                </h1>
              )}
              <div className="flex items-center gap-2">
                 <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal bg-orange-50 border-orange-200 text-orange-700">
                    <ChefHat className="w-3 h-3 mr-1" />
                    Kitchen Dashboard
                 </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end border-r pr-4 border-gray-200 text-right">
               <span className="text-sm font-semibold text-gray-800">{user?.name}</span>
               <div className="flex items-center gap-1 text-xs text-muted-foreground capitalize">
                  <User className="w-3 h-3" />
                  {user?.role}
               </div>
            </div>

            <div className="flex items-center gap-2">
              <ChangePasswordDialog />
              <Button variant="destructive" size="sm" onClick={handleLogout} className="gap-2">
                  <LogOut className="w-4 h-4" />
                  <span className="hidden md:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6">
        {/* STATS */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-blue-50 border-blue-100">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{confirmedOrders.length}</p>
                <p className="text-sm font-medium text-blue-600">Confirmed</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 border-orange-100">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-full text-orange-600">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-700">{preparingOrders.length}</p>
                <p className="text-sm font-medium text-orange-600">Cooking</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-100">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full text-green-600">
                <ChefHat className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">{readyOrders.length}</p>
                <p className="text-sm font-medium text-green-600">Ready</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="all">All Active</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed ({confirmedOrders.length})</TabsTrigger>
            <TabsTrigger value="preparing">Cooking ({preparingOrders.length})</TabsTrigger>
            <TabsTrigger value="ready">Ready ({readyOrders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <OrderColumn title="Confirmed by Cashier" orders={confirmedOrders} color="blue" actionLabel="Start Cooking" onAction={startCooking} />
            <OrderColumn title="Cooking" orders={preparingOrders} color="orange" actionLabel="Mark Ready" onAction={markReady} />
            <OrderColumn title="Ready to Serve" orders={readyOrders} color="green" actionLabel="Mark Served" onAction={markServed} />
          </TabsContent>

          <TabsContent value="confirmed">
            <OrderColumn title="Confirmed Orders" orders={confirmedOrders} color="blue" actionLabel="Start Cooking" onAction={startCooking} columns={3} />
          </TabsContent>

          <TabsContent value="preparing">
            <OrderColumn title="Cooking In Progress" orders={preparingOrders} color="orange" actionLabel="Mark Ready" onAction={markReady} columns={3} />
          </TabsContent>

          <TabsContent value="ready">
            <OrderColumn title="Ready for Pickup" orders={readyOrders} color="green" actionLabel="Mark Served" onAction={markServed} columns={3} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

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
            const res = await changePasswordApi({ currentPassword: formData.currentPassword, newPassword: formData.newPassword });
            if (res.data.success) {
                toast.success("Password updated successfully");
                setOpen(false);
                setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to update password");
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
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Update Password
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

const OrderColumn = ({ title, orders, color, actionLabel, onAction, columns = 1 }: any) => {
  const colorClasses: any = { blue: "border-l-blue-500 bg-blue-50/30", orange: "border-l-orange-500 bg-orange-50/30", green: "border-l-green-500 bg-green-50/30" };
  const titleColorClasses: any = { blue: "text-blue-700", orange: "text-orange-700", green: "text-green-700" };
  const btnColorClasses: any = { blue: "bg-blue-600 hover:bg-blue-700", orange: "bg-orange-600 hover:bg-orange-700", green: "bg-green-600 hover:bg-green-700" };
  const dotColor: any = { blue: "bg-blue-500", orange: "bg-orange-500", green: "bg-green-500" };

  return (
    <section>
      <h2 className={`font-bold text-lg mb-4 flex items-center gap-2 ${titleColorClasses[color]}`}>
        <span className={`w-3 h-3 rounded-full inline-block ${dotColor[color]}`} />
        {title}
      </h2>
      <div className={`grid md:grid-cols-${columns} gap-4`}>
        {orders.map((order: any) => (
          <Card key={order.id} className={`border-l-4 shadow-sm ${colorClasses[color]}`}>
            <CardContent className="pt-4 text-gray-900">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-lg">#{order.id.toString().slice(-4)}</p>
                  <p className="text-xs text-muted-foreground">{order.tableNumber}</p>
                </div>
                <Badge variant="outline">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Badge>
              </div>

              <div className="my-3 space-y-1">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm font-medium">
                    <span>{item.quantity}x {item.name}</span>
                  </div>
                ))}
              </div>

              {/* INSTRUCTIONS FUNCTIONALITY ADDED HERE */}
              {order.instructions && (
                <div className="mt-3 mb-4 p-2 bg-amber-100 border border-amber-200 rounded-md">
                  <div className="flex items-center gap-1.5 mb-1">
                    <ClipboardList className="w-3.5 h-3.5 text-amber-700" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Note</span>
                  </div>
                  <p className="text-sm font-semibold text-amber-950 leading-tight italic">
                    {order.instructions}
                  </p>
                </div>
              )}

              <Button
                className={`w-full text-white shadow-none ${btnColorClasses[color]}`}
                onClick={() => onAction(order.id)}
              >
                {actionLabel}
              </Button>
            </CardContent>
          </Card>
        ))}
        {orders.length === 0 && (
          <div className="p-8 border-2 border-dashed rounded-lg text-center text-muted-foreground col-span-full">
            No orders in this stage
          </div>
        )}
      </div>
    </section>
  );
};

export default KitchenPanel;