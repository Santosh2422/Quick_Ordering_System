export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  isVeg: boolean;
  isAvailable: boolean;
  preparationTime: number; // in minutes
}

export interface CartItem extends MenuItem {
  quantity: number;
  menuItemId?: string; // For backend payload mapping
  totalPrice?: number;
}

export type OrderStatus = 'pending' | 'placed' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled' | 'bill_requested';

export interface Order {
  id: string; // Map _id to id
  _id?: string; // Optional for compatibility with backend responses
  sessionId: string;
  restaurantId: string;
  tableNumber: string;
  items: CartItem[];
  instructions: string;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string; // Date string from backend
  customerPhone?: string; // Optional if not used
}

export interface Table {
  id: string;
  name: string;
  qrCode: string;
  isOccupied: boolean;
}

export interface Cashier {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
}
