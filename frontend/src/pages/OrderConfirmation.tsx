import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Home, Clock, MapPin, Loader2, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RestaurantLogo } from '@/components/RestaurantLogo';

// Services & Context
import { useSession } from "@/context/SessionContext";
import { Order } from '@/types/restaurant';

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useSession(); 
  const order = location.state?.order as Order | undefined;

  const restaurant = session.restaurantDetails;
  const loadingRestaurant = false; 

  if (!order) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-6 text-center">
        <p className="text-muted-foreground mb-4">No order found</p>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    );
  }

  const estimatedTime = Math.max(...order.items.map((item) => item.preparationTime)) + 5;

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-4 py-6 sm:px-6 sm:py-12">
      <div className="w-full max-w-md animate-fade-in flex flex-col items-center">
        
        {/* BRANDING SECTION */}
        <div className="flex flex-col items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center overflow-hidden relative shrink-0 shadow-sm">
            {loadingRestaurant ? (
              <Loader2 className="w-6 h-6 text-orange-600 animate-spin" />
            ) : restaurant?.image ? (
              <img src={restaurant.image} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Store className="w-6 h-6 text-orange-600" />
            )}
          </div>
          
          <div className="flex flex-col items-center text-center px-2">
            <h1 className="font-bold text-lg sm:text-xl leading-tight text-gray-900 line-clamp-1">
              {restaurant?.name || "Order Confirmed"}
            </h1>
          </div>
        </div>

        {/* Success Animation */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 bg-green-100 rounded-full flex items-center justify-center animate-pulse-glow">
            <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-1">
            Order Confirmed!
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Kitchen is preparing your meal
          </p>
        </div>

        {/* Order Details Card */}
        <Card className="w-full mb-6 shadow-xl shadow-orange-900/5 border-orange-100 rounded-[2rem] overflow-hidden">
          <CardContent className="pt-6 sm:pt-8 space-y-4 sm:space-y-5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest">Order ID</span>
              <Badge variant="outline" className="font-mono text-[10px] sm:text-xs truncate bg-gray-50">
                {order.id}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 pb-2">
              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <MapPin className="w-3.5 h-3.5 text-orange-500" />
                  Table
                </span>
                <span className="font-bold text-base sm:text-lg text-gray-900">{order.tableNumber}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <Clock className="w-3.5 h-3.5 text-orange-500" />
                  Wait Time
                </span>
                <span className="font-bold text-base sm:text-lg text-gray-900">~{estimatedTime}m</span>
              </div>
            </div>

            <div className="border-t border-dashed pt-4 sm:pt-5">
              <h3 className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-widest mb-3">Order Summary</h3>
              <div className="space-y-2.5 max-h-[150px] overflow-y-auto pr-1">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-[13px] sm:text-sm gap-4">
                    <span className="text-gray-700 font-medium">
                      <span className="text-orange-600 font-bold">{item.quantity}x</span> {item.name}
                    </span>
                    <span className="shrink-0 font-bold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4 sm:pt-5 flex justify-between items-center font-black text-lg sm:text-xl">
              <span className="text-gray-900 uppercase text-xs tracking-[0.2em]">Total Amount</span>
              <span className="text-orange-600">₹{order.totalAmount.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="w-full space-y-3">
          <Button
            onClick={() => navigate('/orders')}
            size="lg"
            className="w-full h-12 sm:h-14 text-sm sm:text-base bg-orange-500 hover:bg-orange-600 rounded-2xl font-bold shadow-lg shadow-orange-200 transition-all active:scale-95"
          >
            Track Order Status
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => navigate('/menu')}
              variant="outline"
              className="w-full h-11 sm:h-12 text-xs sm:text-sm border-orange-200 text-orange-600 rounded-xl hover:bg-orange-50 font-bold"
            >
              Order More
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full h-11 sm:h-12 text-xs sm:text-sm border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 font-bold"
            >
              <Home className="w-3.5 h-3.5 mr-1.5" />
              Home
            </Button>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}} />
    </div>
  );
};

export default OrderConfirmation;