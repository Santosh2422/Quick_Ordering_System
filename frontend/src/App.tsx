import React from "react";
import { Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

import { SessionProvider } from "@/context/SessionContext";
import { AuthProvider } from "@/context/AuthContext";
import { OrderProvider } from "@/context/OrderContext";
import { CartProvider } from "@/context/CartContext";
import { SocketProvider } from "@/context/SocketContext";

import ProtectedRoute from "@/routes/ProtectedRoute";

/* ---------- WELCOME PAGES ---------- */
import Index from "./pages/Index";

/* ---------- CUSTOMER FLOW ---------- */
import CustomerEntry from "./pages/CustomerEntry";
import ScanTable from "./pages/ScanTable";
import Menu from "./pages/Menu";
import Cart from "./pages/Cart";
import Payment from "./pages/Payment";
import OrderConfirmation from "./pages/OrderConfirmation";
import CustomerOrders from "./pages/CustomerOrders";

/* ---------- AUTH ---------- */
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Logout from "./pages/Logout";
import Home from "./pages/Home"

/* ---------- ADMIN ---------- */
import AdminPage from "./pages/AdminPage";

/* ---------- OWNER (NESTED) ---------- */
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import OwnerHome from "./pages/owner/OwnerHome";
import MenuManagement from "./pages/owner/MenuManagement";
import CashierManagement from "./pages/owner/CashierManagement";
import TableManagement from "./pages/owner/TableManagement";
import Analytics from "./pages/owner/Analytics";


/* ---------- STAFF PANELS ---------- */
import CashierPanel from "./pages/CashierPanel";
import KitchenPanel from "./pages/KitchenPanel";

/* ---------- FALLBACK ---------- */
import NotFound from "./pages/NotFound";
import RestaurantManagement from "./pages/owner/RestaurantManagement";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>

      {/* 1. AuthProvider is usually the base (provides User/Token) */}
      <AuthProvider>

        {/* 2. SocketProvider connects using Auth (optional) but must exist BEFORE Session/Order */}
        <SocketProvider>

          {/* 3. SessionProvider (Now safe to use 'useSocket') */}
          <SessionProvider>

            {/* 4. OrderProvider (Uses Session & Socket) */}
            <OrderProvider>

              {/* 5. CartProvider (Independent or uses Menu/Order) */}
              <CartProvider>

                <TooltipProvider>
                  <Toaster />
                  <Sonner />

                  <Routes>
                    {/* ================= WELCOME ================= */}
                    <Route path="/" element={<Index />} />

                    {/* ================= AUTH ================= */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/logout" element={<Logout />} />
                    <Route path="/home" element={<Home />} />

                    {/* ================= CUSTOMER ================= */}
                    <Route path="/customer-entry" element={<CustomerEntry />} />
                    <Route path="/scan-table" element={<ScanTable />} />
                    <Route path="/menu" element={<Menu />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/payment" element={<Payment />} />
                    <Route
                      path="/order-confirmation"
                      element={<OrderConfirmation />}
                    />
                    <Route path="/orders" element={<CustomerOrders />} />

                    {/* ================= ADMIN ================= */}
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                          <AdminPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* ================= OWNER (NESTED) ================= */}
                    <Route
                      path="/owner"
                      element={
                        <ProtectedRoute allowedRoles={["owner"]}>
                          <OwnerDashboard />
                        </ProtectedRoute>
                      }
                    >
                      <Route index element={<OwnerHome />} />
                      <Route path="menu" element={<MenuManagement />} />
                      <Route path="cashiers" element={<CashierManagement />} />
                      <Route path="tables" element={<TableManagement />} />
                      <Route path="analytics" element={<Analytics />} />
                      <Route path="restaurant" element={<RestaurantManagement />} />

                    </Route>

                    {/* ================= STAFF ================= */}
                    <Route
                      path="/cashier"
                      element={
                        <ProtectedRoute allowedRoles={["cashier", "owner", "staff"]}>
                          <CashierPanel />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/kitchen"
                      element={
                        <ProtectedRoute allowedRoles={["kitchen", "owner", "staff"]}>
                          <KitchenPanel />
                        </ProtectedRoute>
                      }
                    />

                    {/* ================= 404 ================= */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </TooltipProvider>
              </CartProvider>
            </OrderProvider>
          </SessionProvider>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;