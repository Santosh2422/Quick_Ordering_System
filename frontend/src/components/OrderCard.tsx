import { Clock, MapPin, Phone, ChefHat, CheckCircle, Truck } from 'lucide-react';
import { Order } from '@/types/restaurant';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface OrderCardProps {
  order: Order;
  onStatusChange?: (orderId: string, status: Order['status']) => void;
  showActions?: boolean;
  variant?: 'cashier' | 'kitchen' | 'admin';
}

export function OrderCard({ order, onStatusChange, showActions = true, variant = 'admin' }: OrderCardProps) {
  const statusColors = {
    pending: 'bg-warning text-warning-foreground',
    confirmed: 'bg-primary text-primary-foreground',
    preparing: 'bg-kitchen text-kitchen-foreground',
    ready: 'bg-success text-success-foreground',
    served: 'bg-muted text-muted-foreground',
    paid: 'bg-accent text-accent-foreground',
  };

  const statusIcons = {
    pending: Clock,
    confirmed: CheckCircle,
    preparing: ChefHat,
    ready: Truck,
    served: CheckCircle,
    paid: CheckCircle,
  };

  const StatusIcon = statusIcons[order.status];

  const getNextAction = () => {
    if (variant === 'cashier') {
      if (order.status === 'pending') return { label: 'Confirm Order', nextStatus: 'confirmed' as const };
      if (order.status === 'ready') return { label: 'Mark as Served', nextStatus: 'served' as const };
      if (order.status === 'served') return { label: 'Confirm Payment', nextStatus: 'paid' as const };
    }
    if (variant === 'kitchen') {
      if (order.status === 'confirmed') return { label: 'Start Preparing', nextStatus: 'preparing' as const };
      if (order.status === 'preparing') return { label: 'Mark Ready', nextStatus: 'ready' as const };
    }
    return null;
  };

  const nextAction = getNextAction();

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-display">{order.id}</CardTitle>
          <Badge className={statusColors[order.status]}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {order.tableNumber}
          </span>
          <span className="flex items-center gap-1">
            <Phone className="w-4 h-4" />
            {order.customerPhone}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {formatDistanceToNow(order.createdAt, { addSuffix: true })}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center text-sm">
              <span>
                {item.quantity}x {item.name}
              </span>
              <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center pt-3 border-t">
          <span className="font-semibold">Total</span>
          <span className="font-bold text-lg text-primary">${order.totalAmount.toFixed(2)}</span>
        </div>
        {showActions && nextAction && onStatusChange && (
          <Button
            onClick={() => onStatusChange(order.id, nextAction.nextStatus)}
            className="w-full mt-4"
          >
            {nextAction.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
