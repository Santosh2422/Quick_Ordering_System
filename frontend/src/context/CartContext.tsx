import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { CartItem } from "@/types/restaurant";
import { toast } from "sonner";

/* ---------- TYPES ---------- */
export type { CartItem };

type CartContextType = {
  cartItems: CartItem[];
  tableNumber: string;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void; // Used by CartItemCard
  removeItem: (id: string) => void;     // <--- ADDED (Used by Payment.tsx)
  clearCart: () => void;
  setTableNumber: (table: string) => void;
  totalPrice: number;
};

/* ---------- CONTEXT ---------- */
const CartContext = createContext<CartContextType | undefined>(undefined);

/* ---------- PROVIDER ---------- */
export const CartProvider = ({ children }: { children: ReactNode }) => {
  // 1. Initialize from Local Storage if available
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [tableNumber, setTableNumberState] = useState<string>(() => {
    return localStorage.getItem("activeTable") || "";
  });

  // 2. Persist to Local Storage whenever cart changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const setTableNumber = (table: string) => {
    setTableNumberState(table);
    localStorage.setItem("activeTable", table);
  };

  /* ✅ ADD ITEM */
  const addItem = (item: Omit<CartItem, "quantity">) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);

      if (existing) {
        toast.success(`Updated quantity for ${item.name}`);
        return prev.map((i) =>
          i.id === item.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }

      toast.success(`Added ${item.name} to cart`);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  /* ✅ UPDATE QUANTITY */
  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return; 
    
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  /* ✅ REMOVE ITEM (The Logic) */
  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
    toast.info("Item removed from cart");
  };

  /* ✅ CLEAR CART */
  const clearCart = () => {
    setCartItems([]);
    setTableNumber("");
    localStorage.removeItem("cart");
    localStorage.removeItem("activeTable");
  };

  /* ✅ TOTAL PRICE */
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        tableNumber,
        addItem,
        updateQuantity,
        removeFromCart,      // Used by CartItemCard
        removeItem: removeFromCart, // <--- ALIAS: Points to same logic for Payment.tsx
        clearCart,
        setTableNumber,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

/* ---------- HOOK ---------- */
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};