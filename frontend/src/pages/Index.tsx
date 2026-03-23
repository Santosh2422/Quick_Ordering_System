import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, Settings, ChefHat, CreditCard, LogOut, User, Menu as MenuIcon, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RestaurantLogo } from "@/components/RestaurantLogo";
import { useAuth } from "@/context/AuthContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Index = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen gradient-dark flex flex-col">
      {/* ================= TOP RIGHT ACTIONS ================= */}
      <div className="absolute top-6 right-6 flex items-center gap-4">
        {user ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 text-white w-12 h-12">
                <MenuIcon className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] border-none bg-white p-0">
              <SheetHeader className="p-8 pb-4 text-left border-b border-orange-50 bg-orange-50/30">
                <SheetTitle className="flex items-center gap-2 text-2xl font-black text-orange-950">
                  <RestaurantLogo size="sm" />
                  Navigation
                </SheetTitle>
                <div className="mt-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
                    {user.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-orange-950">{user.name}</p>
                    <p className="text-[10px] uppercase tracking-widest font-black text-orange-500">{user.role}</p>
                  </div>
                </div>
              </SheetHeader>

              <div className="p-4 space-y-2">
                <div className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Management</div>

                {user.role === "admin" && (
                  <Button variant="ghost" className="w-full justify-start gap-3 h-14 rounded-2xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 font-bold" onClick={() => navigate("/admin")}>
                    <ShieldCheck className="w-5 h-5" /> System Admin
                  </Button>
                )}

                {(user.role === "owner" || user.role === "admin") && (
                  <Button variant="ghost" className="w-full justify-start gap-3 h-14 rounded-2xl text-slate-600 hover:text-orange-600 hover:bg-orange-50 font-bold" onClick={() => navigate("/owner")}>
                    <User className="w-5 h-5" /> Owner Dashboard
                  </Button>
                )}

                {(user.role === "cashier" || user.role === "owner" || user.role === "staff") && (
                  <Button variant="ghost" className="w-full justify-start gap-3 h-14 rounded-2xl text-slate-600 hover:text-sky-600 hover:bg-sky-50 font-bold" onClick={() => navigate("/cashier")}>
                    <CreditCard className="w-5 h-5" /> Cashier Panel
                  </Button>
                )}

                {(user.role === "kitchen" || user.role === "owner" || user.role === "staff") && (
                  <Button variant="ghost" className="w-full justify-start gap-3 h-14 rounded-2xl text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 font-bold" onClick={() => navigate("/kitchen")}>
                    <ChefHat className="w-5 h-5" /> Kitchen Panel
                  </Button>
                )}

                <div className="pt-4 border-t border-slate-50 mt-4">
                  <Button variant="ghost" className="w-full justify-start gap-3 h-14 rounded-2xl text-red-500 hover:bg-red-50 font-bold" onClick={logout}>
                    <LogOut className="w-5 h-5" /> Logout Session
                  </Button>
                </div>
              </div>

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-300 uppercase tracking-widest text-center">
                v2.0 Beta • Enterprise Food App
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <Link to="/login">
            <Button variant="ghost" className="rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 text-white font-bold px-6">
              Staff Access
            </Button>
          </Link>
        )}
      </div>

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="animate-fade-in">
          <RestaurantLogo size="lg" />
        </div>

        <p
          className="mt-8 text-lg text-muted-foreground max-w-md font-body animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          Experience the finest Italian cuisine in a warm and elegant atmosphere
        </p>

        <Button
          onClick={() => navigate("/customer-entry")}
          size="lg"
          className="mt-10 rounded-full px-10 py-6 text-lg shadow-lg animate-fade-in"
          style={{ animationDelay: "0.4s" }}
        >
          Get Started
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>

        {/* DECORATION */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 text-muted-foreground text-sm">
          <span>🍕</span><span>•</span><span>🍝</span><span>•</span>
          <span>🍷</span><span>•</span><span>🍰</span>
        </div>
      </div>

      {/* BACKGROUND BLURS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
};

export default Index;
