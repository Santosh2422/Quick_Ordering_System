import { Plus, Clock } from 'lucide-react';
import { MenuItem } from '@/types/restaurant';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';

interface DishCardProps {
  item: MenuItem;
}

export function DishCard({ item }: DishCardProps) {
  const { addItem } = useCart();

  const handleAddToCart = () => {
    if (!item.isAvailable) return;
    addItem(item);
    toast.success(`${item.name} added to cart`);
  };

  return (
    <Card className={`overflow-hidden transition-all duration-300 hover:shadow-lg ${!item.isAvailable ? 'opacity-60' : ''}`}>
      <div className="relative">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-40 object-cover"
        />
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Badge variant="destructive" className="text-sm">
              Not Available
            </Badge>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {item.preparationTime}m
          </Badge>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-display font-semibold text-lg text-foreground">
            {item.name}
          </h3>
          <span className="font-bold text-primary text-lg">
            ${item.price.toFixed(2)}
          </span>
        </div>
        
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {item.description}
        </p>
        
        <Button
          onClick={handleAddToCart}
          disabled={!item.isAvailable}
          className="w-full"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add to Cart
        </Button>
      </div>
    </Card>
  );
}
