import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingBag, MapPin, CreditCard, Loader2, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RestaurantLogo } from "@/components/RestaurantLogo";

import { useCart } from "@/context/CartContext";
import { useSession } from "@/context/SessionContext";
import { CartItemCard } from "@/components/CartItem";
import { Badge } from "@/components/ui/badge";

const Cart = () => {
  const navigate = useNavigate();

  const { cartItems, totalPrice } = useCart();
  const { session } = useSession();

  const restaurant = session.restaurantDetails;
  const loadingRestaurant = false;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-6 text-center">
        <ShoppingBag className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2 text-gray-900">Your cart is empty</h2>
        <p className="text-muted-foreground mb-6">Add some delicious dishes!</p>
        <Button onClick={() => navigate("/menu")} className="rounded-xl px-8">Browse Menu</Button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* HEADER: Fluid layout to prevent clumping */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b w-full">
        <div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 flex items-center">
          
          {/* Back Button - Minimalist on mobile */}
          <div className="flex-1 flex justify-start">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/menu")}
              className="h-9 px-2 sm:px-4 hover:bg-orange-50 text-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm font-medium">Back</span>
            </Button>
          </div>

          {/* BRANDING: Centered with auto-truncation */}
          <div className="flex-[2] flex items-center justify-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-orange-100 border border-orange-200 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
              {restaurant?.image ? (
                <img src={restaurant.image} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Store className="w-4 h-4 text-orange-600" />
              )}
            </div>
            <h1 className="font-bold text-sm sm:text-base text-gray-900 uppercase tracking-tight truncate max-w-[120px] sm:max-w-none">
              {restaurant?.name || "Cart"}
            </h1>
          </div>

          {/* Right Section: Hidden logo on smallest screens to save space */}
          <div className="flex-1 flex justify-end">
            <div className="hidden sm:block">
              <RestaurantLogo size="sm" showText={false} />
            </div>
            <div className="sm:hidden w-8"></div> {/* Visual balance spacer */}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT: Scrollable area */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Your Order</h1>
          <Badge variant="secondary" className="rounded-full px-3 py-1 font-medium text-orange-700 bg-orange-50 border-orange-100">
            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
          </Badge>
        </div>

        {/* ORDER DETAILS: Minimalist Card */}
        <Card className="mb-8 border-none bg-orange-50/50 shadow-none ring-1 ring-orange-100/50">
          <CardContent className="py-4 px-4 sm:px-6">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-white rounded-xl shadow-sm border border-orange-100">
                <MapPin className="w-4 h-4 text-orange-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase text-orange-400 font-black tracking-widest">Table</span>
                <span className="font-bold text-sm sm:text-base text-gray-800">
                  {(session.tableName || session.tableId) ?? "Standard Table"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CART ITEMS: Spaced properly for mobile thumb-scrolling */}
        <div className="space-y-4 pb-10">
          {cartItems.map((item) => (
            <div key={item.id} className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
              <CartItemCard item={item} />
            </div>
          ))}
        </div>
      </main>

      {/* PAYMENT BAR: Fixed at bottom with modern glass effect */}
      <footer className="sticky bottom-0 w-full bg-white/80 backdrop-blur-lg border-t z-50">
        <div className="max-w-2xl mx-auto flex justify-between items-center py-4 px-5 sm:px-6 mb-[env(safe-area-inset-bottom)]">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Total Bill</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black text-gray-900">₹{totalPrice}</span>
              <span className="text-[10px] text-green-600 font-bold uppercase">Incl. Tax</span>
            </div>
          </div>

          <Button 
            onClick={() => navigate("/payment")} 
            size="lg"
            className="h-12 px-6 sm:px-10 text-sm sm:text-base font-bold rounded-2xl bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-200 active:scale-95 transition-all"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Proceed to checkout
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default Cart;