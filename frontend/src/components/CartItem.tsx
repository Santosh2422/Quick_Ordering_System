import { Minus, Plus, Trash2 } from 'lucide-react';
import { CartItem as CartItemType } from '@/types/restaurant';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';

interface CartItemProps {
  item: CartItemType;
}

export function CartItemCard({ item }: CartItemProps) {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-card rounded-xl border shadow-sm w-full">
      
      {/* 1. IMAGE: Full width on mobile (middle), side-aligned on desktop */}
      <div className="w-full sm:w-20 h-40 sm:h-20 shrink-0 overflow-hidden rounded-lg border bg-muted flex justify-center">
        <img
          src={item.image}
          alt={item.name}
          className="h-full w-full object-cover"
        />
      </div>
      
      {/* 2. CONTENT AREA: Stacked on mobile, row on desktop */}
      <div className="flex flex-col sm:flex-row flex-1 items-center sm:items-center justify-between w-full gap-4">
        
        {/* Title & Unit Price */}
        <div className="text-center sm:text-left min-w-0">
          <h4 className="font-bold text-lg sm:text-base text-foreground truncate max-w-[250px]">
            {item.name}
          </h4>
          <p className="text-sm text-muted-foreground font-medium">
            ₹{item.price.toFixed(2)} / unit
          </p>
        </div>

        {/* 3. CONTROLS & TOTAL: Unified row that stays clear of the image */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-4 sm:gap-6 border-t sm:border-none pt-4 sm:pt-0">
          
          {/* Quantity Group */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 border-orange-200 text-orange-600 hover:bg-orange-50"
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
            >
              <Minus className="w-4 h-4" />
            </Button>
            
            <span className="w-8 text-center font-bold text-lg sm:text-base">{item.quantity}</span>
            
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 border-orange-200 text-orange-600 hover:bg-orange-50"
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Subtotal & Delete */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-muted-foreground leading-none">Subtotal</p>
              <span className="font-black text-lg sm:text-base text-foreground">
                ₹{(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-red-500 hover:bg-red-50"
              onClick={() => removeFromCart(item.id)}
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}