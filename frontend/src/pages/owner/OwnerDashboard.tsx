import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"; 
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Users,
  Armchair,
  Store,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  Building2,
  Menu, 
  TrendingUp
} from "lucide-react";
import { createRestaurant } from "@/services/restaurant.service";
import { toast } from "sonner";

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const [newRestaurant, setNewRestaurant] = useState({
    name: "",
    cuisine: "",
    description: "",
    logo: "",
    address: { street: "", city: "", state: "", zipCode: "", country: "India" }
  });

  const getNavLinkClass = (isActive: boolean) => {
    const baseClasses = "flex items-center gap-3 py-3 rounded-xl transition-all duration-300 overflow-hidden whitespace-nowrap flex-shrink-0"; // Added flex-shrink-0
    const activeClasses = "bg-orange-500 text-white font-medium shadow-md shadow-orange-200";
    const inactiveClasses = "text-gray-600 hover:bg-orange-50 hover:text-orange-600";
    const layoutClasses = isCollapsed ? "lg:justify-center lg:px-2 px-4" : "px-4";

    return `${baseClasses} ${layoutClasses} ${isActive ? activeClasses : inactiveClasses}`;
  };

  const handleAddressChange = (field: string, value: string) => {
    setNewRestaurant(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value }
    }));
  };

  const handleCreateSubmit = async () => {
    if (!newRestaurant.name || !newRestaurant.address.street || !newRestaurant.address.city) {
      toast.error("Name, Street, and City are required");
      return;
    }

    try {
      setCreateLoading(true);
      const res = await createRestaurant(newRestaurant);
      if (res.data.success) {
        toast.success("New branch created successfully!");
        setIsCreateOpen(false);
        setNewRestaurant({
          name: "", cuisine: "", description: "", logo: "",
          address: { street: "", city: "", state: "", zipCode: "", country: "India" }
        });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create restaurant");
    } finally {
      setCreateLoading(false);
    }
  };

  // Content helper
  const dashboardSidebarContent = (
    // Added h-full and flex-col to ensure it fills the height
    <div className="flex flex-col h-full overflow-hidden"> 
      <div className={`mb-8 flex items-center flex-shrink-0 ${isCollapsed ? "lg:justify-center" : "justify-between"}`}>
        <div className={`px-2 overflow-hidden whitespace-nowrap ${isCollapsed ? "lg:hidden block" : "block"}`}>
          <h2 className="text-xl font-bold text-orange-950 flex items-center gap-2">
            <Store className="w-6 h-6 text-orange-500" />
            Owner
          </h2>
          <p className="text-xs text-muted-foreground mt-1 ml-8">Manage outlet</p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`hidden lg:flex text-gray-400 hover:text-orange-600 ${isCollapsed ? "absolute -right-3 top-6 bg-white border shadow-sm rounded-full h-6 w-6" : ""}`}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      <div className="mb-6 flex-shrink-0">
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button
              className={`w-full bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all ${isCollapsed ? "lg:px-0 px-4" : "px-4"}`}
              title="Add New Branch"
            >
              <Plus className={`w-4 h-4 ${isCollapsed ? "lg:mr-0 mr-2" : "mr-2"}`} />
              <span className={isCollapsed ? "lg:hidden block" : "block"}>New Branch</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Building2 className="w-6 h-6 text-indigo-600" />
                Create New Restaurant
              </DialogTitle>
              <DialogDescription>Add a new branch to your account.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Restaurant Name *</Label>
                <Input
                  placeholder="e.g. Tasty Bites"
                  value={newRestaurant.name}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="Cuisine type, specialty..."
                  value={newRestaurant.description}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Logo / Image URL</Label>
                <Input
                  placeholder="https://..."
                  value={newRestaurant.logo}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, logo: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Street Address *</Label>
                  <Input
                    placeholder="123 Main St"
                    value={newRestaurant.address.street}
                    onChange={(e) => handleAddressChange('street', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>City *</Label>
                  <Input
                    placeholder="City"
                    value={newRestaurant.address.city}
                    onChange={(e) => handleAddressChange('city', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input
                    placeholder="State"
                    value={newRestaurant.address.state}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Zip Code</Label>
                  <Input
                    placeholder="Zip Code"
                    value={newRestaurant.address.zipCode}
                    onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateSubmit} disabled={createLoading} className="bg-indigo-600">
                {createLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Branch"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* NAVIGATION SECTION - This is the part that now scrolls */}
      <nav className="space-y-2 flex-1 overflow-y-auto no-scrollbar pr-1">
        {[
          { to: "/owner", icon: LayoutDashboard, label: "Dashboard", end: true },
          { to: "/owner/analytics", icon: TrendingUp, label: "Analytics" },
          { to: "/owner/menu", icon: UtensilsCrossed, label: "Menu Management" },
          { to: "/owner/restaurant", icon: Store, label: "Restaurant Details" },
          { to: "/owner/cashiers", icon: Users, label: "Staff / Cashiers" },
          { to: "/owner/tables", icon: Armchair, label: "Tables" },
        ].map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={() => setIsMobileMenuOpen(false)}
            className={({ isActive }) => getNavLinkClass(isActive)}
          >
            <link.icon className="w-5 h-5 flex-shrink-0" />
            <span className={`transition-opacity duration-200 ${isCollapsed ? "lg:opacity-0 lg:w-0 lg:hidden block" : "block opacity-100"}`}>
              {link.label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* FOOTER SECTION */}
      <div className="mt-auto border-t pt-4 flex-shrink-0">
        {(!isCollapsed || isMobileMenuOpen) && (
          <div className="bg-orange-50/50 p-3 rounded-xl mb-4 border border-orange-100 overflow-hidden">
            <p className="text-[10px] uppercase font-bold text-orange-400 tracking-wider mb-1">Logged in as</p>
            <p className="text-sm font-bold text-orange-950 truncate">{user?.name || "Owner"}</p>
            <p className="text-xs text-orange-800/60 truncate">{user?.email}</p>
          </div>
        )}

        <Button
          variant="ghost"
          className={`w-full text-red-500 hover:text-red-600 hover:bg-red-50 flex items-center ${isCollapsed ? "lg:justify-center justify-start" : "gap-2"}`}
          onClick={() => {
            logout();
            navigate("/", { replace: true });
          }}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span className={isCollapsed ? "lg:hidden block" : "block"}>Logout</span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
      <header className="lg:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-30">
        <h2 className="text-lg font-bold text-orange-950 flex items-center gap-2">
          <Store className="w-6 h-6 text-orange-500" />
          Owner
        </h2>
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] p-4 flex flex-col h-full overflow-hidden">
            {dashboardSidebarContent}
          </SheetContent>
        </Sheet>
      </header>

      <aside
        className={`
          hidden lg:flex
          ${isCollapsed ? "w-20" : "w-64"} 
          border-r p-4 bg-white shadow-sm flex flex-col sticky top-0 h-screen
          transition-all duration-300 ease-in-out z-20
        `}
      >
        {dashboardSidebarContent}
      </aside>

      <main className="flex-1 p-4 lg:p-8 overflow-y-auto w-full">
        <Outlet />
      </main>
    </div>
  );
};

export default OwnerDashboard;