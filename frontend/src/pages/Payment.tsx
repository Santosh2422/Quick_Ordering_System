import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CreditCard,
  CheckCircle,
  CookingPot,
  Utensils,
  Plus,
  Minus,
  Loader2,
  Store
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

import { toast } from "sonner";

import { useSession } from "@/context/SessionContext";
import { useCart } from "@/context/CartContext";
import { useOrders } from "@/context/OrderContext";

/* ---------- EXTRA ITEMS ---------- */
const EXTRA_ITEMS = [
  { id: "chutney", name: "Chutney", price: 10 },
  { id: "sauce", name: "Sauce", price: 10 },
  { id: "tissue", name: "Tissue", price: 0 },
  { id: "salt", name: "Salt", price: 0 },
];

const Payment = () => {
  const navigate = useNavigate();

  const { session, customerPhone } = useSession();
  const {
    cartItems,
    addItem,
    clearCart,
    removeItem,
    totalPrice,
  } = useCart();
  const { addOrder } = useOrders();

  const [customNote, setCustomNote] = useState("");
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderStatus, setOrderStatus] =
    useState<"preparing" | "ready">("preparing");

  // --- RESTAURANT STATE (Now pulling from Session to avoid login redirect) ---
  const restaurant = session.restaurantDetails;
  const loadingRestaurant = false; // Data is already in session

  /* ---------- GUARD ---------- */
  useEffect(() => {
    if (!session?.sessionId || cartItems.length === 0) {
      // navigate("/menu", { replace: true });
    }
  }, [session?.sessionId, cartItems.length, navigate]);

  /* ---------- PAYMENT / PLACE ORDER ---------- */
  const handlePayment = async () => {
    if (!session?.sessionId || !session?.restaurantId) {
      toast.error("Session missing. Please scan QR Code.");
      return;
    }

    const newOrder = {
      id: `ORDER_${Date.now()}`,
      sessionId: session.sessionId,
      restaurantId: session.restaurantId,
      tableNumber: session.tableName || session.tableId || "Table 1",
      customerPhone: customerPhone || "1234567890",
      items: cartItems.map(item => ({
        ...item,
        itemId: item.id,
        preparationTime: item.preparationTime || 15
      })),
      instructions: customNote,
      totalAmount: totalPrice,
      status: "placed" as const,
      createdAt: new Date().toISOString()
    };

    await addOrder(newOrder);

    clearCart();
    toast.success("Order sent to kitchen! 👨‍🍳");

    navigate("/order-confirmation", { state: { order: newOrder } });
  };

  /* ---------- MAIN UI ---------- */
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-10">
      
      {/* BRANDING SECTION (Safe from 401 Redirects) */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="w-16 h-16 rounded-lg bg-orange-100 border border-orange-200 flex items-center justify-center overflow-hidden relative">
          {loadingRestaurant ? (
            <Loader2 className="w-6 h-6 text-orange-600 animate-spin" />
          ) : restaurant?.image ? (
            <img src={restaurant.image} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <Store className="w-6 h-6 text-orange-600" />
          )}
        </div>
        
        <div className="flex flex-col items-center text-center">
          <h1 className="font-bold text-xl leading-tight text-gray-900 uppercase tracking-tight">
            {restaurant?.name || "Restaurant"}
          </h1>
          <Badge variant="outline" className="text-[10px] bg-orange-50 text-orange-700 mt-1">
            Table {session?.tableName || session?.tableId || "1"}
          </Badge>
        </div>
      </div>

      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle>Review & Place Order</CardTitle>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="checkout">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="checkout">Checkout</TabsTrigger>
              <TabsTrigger value="order-placed">Order-placed</TabsTrigger>
            </TabsList>

            {/* ---------- CHECKOUT TAB ---------- */}
            <TabsContent value="checkout">
              <div className="space-y-4">
                {/* CART ITEMS */}
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center"
                  >
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span className="font-medium">₹{item.price * item.quantity}</span>
                  </div>
                ))}

                <Separator />

                {/* CUSTOM NOTE */}
                <div>
                  <p className="font-medium mb-1 text-sm text-muted-foreground">
                    Kitchen Instructions
                  </p>
                  <Textarea
                    placeholder="Eg: Less spicy, no onion, extra cheese..."
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    className="resize-none"
                  />
                </div>

                <Separator />

                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-orange-600">₹{totalPrice}</span>
                </div>

                <Button
                  variant="outline"
                  className="w-full border-orange-200 text-orange-600 hover:bg-orange-50"
                  onClick={() => navigate("/menu")}
                >
                  Add More Items
                </Button>
              </div>
            </TabsContent>

            {/* ---------- ORDER-PLACED TAB ---------- */}
            <TabsContent value="order-placed">
              <div className="space-y-4 text-center pt-2">
                <Badge className="mb-2 bg-orange-500 hover:bg-orange-500">Amount Due: ₹{totalPrice}</Badge>

                <div className="text-sm text-yellow-600 bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-left">
                  <p className="flex gap-2">
                    <span className="font-bold">Note:</span> 
                    Placing the order sends it immediately to the kitchen for preparation. You can pay later! 😋
                  </p>
                </div>

                <Button
                  size="lg"
                  className="w-full bg-orange-500 hover:bg-orange-600 h-14 text-lg font-bold shadow-lg shadow-orange-200"
                  onClick={handlePayment}
                >
                  <CookingPot className="w-5 h-5 mr-2" />
                  Proceed to Kitchen
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Payment;