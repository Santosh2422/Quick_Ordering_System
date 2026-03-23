import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/context/CartContext";
import { useNavigate } from "react-router-dom";

export function FloatingCart() {
  const { cartItems, totalPrice } = useCart();
  const navigate = useNavigate();

  const totalItems = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  
  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
      <Button
        onClick={() => navigate("/cart")}
        size="lg"
        className="rounded-full shadow-lg px-6 py-6 animate-pulse-glow flex items-center gap-3"
      >
        <ShoppingCart className="w-5 h-5" />

        <span>View Cart</span>

        <Badge
          variant="secondary"
          className="bg-primary-foreground text-primary"
        >
          {totalItems}
        </Badge>

        <span className="font-bold">
          ₹{totalPrice.toFixed(2)}
        </span>
      </Button>
    </div>
  );
}
