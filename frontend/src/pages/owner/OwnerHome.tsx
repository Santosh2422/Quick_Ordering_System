import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { createRestaurant } from "@/services/restaurant.service";
import { toast } from "sonner";
import { Building2, Store, MapPin, ChefHat, User, Settings, Image as ImageIcon, TrendingUp, LayoutGrid } from "lucide-react";

const OwnerHome = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const [restData, setRestData] = useState({
    name: "",
    description: "",
    logo: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "India"
    }
  });

  const handleCreateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await createRestaurant(restData);

      if (res.data.success) {
        toast.success("Restaurant registered successfully!");
        updateUser({ restaurantId: res.data.restaurant.uid });
      } else {
        toast.error(res.data.message || "Failed to create restaurant");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!user?.restaurantId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-10 animate-in fade-in zoom-in duration-500">
        <Card className="border-orange-100 shadow-2xl shadow-orange-900/5 overflow-hidden rounded-3xl md:rounded-[2.5rem] bg-white text-left">
          <div className="h-2 bg-orange-500 w-full" />
          <CardHeader className="text-center pt-8 md:pt-10 px-4 md:px-6">
            <div className="mx-auto w-16 h-16 md:w-20 md:h-20 bg-orange-50 rounded-2xl md:rounded-3xl flex items-center justify-center mb-4 md:mb-6">
              <Building2 className="w-8 h-8 md:w-10 md:h-10 text-orange-500" />
            </div>
            <CardTitle className="text-2xl md:text-3xl font-bold text-orange-950">Setup Your Restaurant</CardTitle>
            <CardDescription className="text-base md:text-lg">Register your business to start managing your kitchen</CardDescription>
          </CardHeader>
          <CardContent className="p-5 md:p-10">
            <form onSubmit={handleCreateRestaurant} className="space-y-4 md:space-y-6">

              <div className="space-y-2">
                <label className="text-xs font-bold text-orange-900/60 ml-1 uppercase tracking-wider">Restaurant Name</label>
                <div className="relative">
                  <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-300" />
                  <Input
                    placeholder="e.g. The Grand Italian"
                    className="pl-12 h-12 md:h-14 rounded-xl md:rounded-2xl border-orange-100 focus-visible:ring-orange-500 text-base md:text-lg font-medium"
                    value={restData.name}
                    onChange={(e) => setRestData({ ...restData, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-orange-900/60 ml-1 uppercase tracking-wider">Logo URL</label>
                <div className="relative">
                  <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-300" />
                  <Input
                    placeholder="https://example.com/logo.png"
                    className="pl-12 h-12 md:h-14 rounded-xl md:rounded-2xl border-orange-100"
                    value={restData.logo}
                    onChange={(e) => setRestData({ ...restData, logo: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-orange-900/60 ml-1 uppercase tracking-wider">Description</label>
                <textarea
                  placeholder="Tell us about your cuisine..."
                  className="w-full p-4 rounded-xl md:rounded-2xl border border-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-500 text-base md:text-lg font-medium min-h-[100px] bg-transparent"
                  value={restData.description}
                  onChange={(e) => setRestData({ ...restData, description: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-orange-900/60 ml-1 uppercase tracking-wider">Street Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-300" />
                    <Input
                      placeholder="Main St, Area 51"
                      className="pl-12 h-12 md:h-14 rounded-xl md:rounded-2xl border-orange-100"
                      value={restData.address.street}
                      onChange={(e) => setRestData({ ...restData, address: { ...restData.address, street: e.target.value } })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-orange-900/60 ml-1 uppercase tracking-wider">City</label>
                  <Input
                    placeholder="New Delhi"
                    className="h-12 md:h-14 rounded-xl md:rounded-2xl border-orange-100"
                    value={restData.address.city}
                    onChange={(e) => setRestData({ ...restData, address: { ...restData.address, city: e.target.value } })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-orange-900/60 ml-1 uppercase tracking-wider">State</label>
                  <Input
                    placeholder="Delhi"
                    className="h-12 md:h-14 rounded-xl md:rounded-2xl border-orange-100"
                    value={restData.address.state}
                    onChange={(e) => setRestData({ ...restData, address: { ...restData.address, state: e.target.value } })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-orange-900/60 ml-1 uppercase tracking-wider">Zip Code</label>
                  <Input
                    placeholder="110001"
                    className="h-12 md:h-14 rounded-xl md:rounded-2xl border-orange-100"
                    value={restData.address.zipCode}
                    onChange={(e) => setRestData({ ...restData, address: { ...restData.address, zipCode: e.target.value } })}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 md:h-16 bg-orange-500 hover:bg-orange-600 rounded-xl md:rounded-2xl text-lg md:text-xl font-bold shadow-xl shadow-orange-500/20 active:scale-[0.98] transition-all"
                disabled={loading}
              >
                {loading ? "Registering..." : "Create Restaurant Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-10 py-4 md:py-6 px-4 md:px-0 animate-in fade-in duration-500 text-left">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-4xl font-extrabold text-orange-950 tracking-tight leading-tight">
          Welcome back, <span className="text-orange-600">{user?.name}</span> 👋
        </h1>
        <p className="text-lg md:text-xl text-orange-800/50 font-medium">
          Manage your culinary empire from one dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
        {[
          { title: "Analytics Dashboard", desc: "View sales & performance", icon: TrendingUp, path: "/owner/analytics", color: "text-blue-500", bg: "bg-blue-50" },
          { title: "Restaurant Details", desc: "Update address & info", icon: Settings, path: "/owner/restaurant", color: "text-gray-600", bg: "bg-gray-100" },
          { title: "Manage Menu", desc: "Add dishes & categories", icon: ChefHat, path: "/owner/menu", color: "text-orange-500", bg: "bg-orange-50" },
          { title: "Manage Staff", desc: "Roles & permissions", icon: User, path: "/owner/cashiers", color: "text-purple-500", bg: "bg-purple-50" },
          { title: "Manage Tables", desc: "QRs & table layouts", icon: LayoutGrid, path: "/owner/tables", color: "text-emerald-500", bg: "bg-emerald-50" },
        ].map((item, idx) => (
          <Card
            key={idx}
            className="group cursor-pointer border-orange-50 hover:border-orange-200 transition-all hover:shadow-2xl hover:shadow-orange-900/5 rounded-3xl overflow-hidden bg-white active:scale-95 sm:active:scale-100"
            onClick={() => navigate(item.path)}
          >
            <CardHeader className="space-y-3 md:space-y-4 p-5 md:p-6">
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl ${item.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <item.icon className={`w-7 h-7 md:w-8 md:h-8 ${item.color}`} />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-lg md:text-xl text-orange-950 font-bold truncate">{item.title}</CardTitle>
                <CardDescription className="text-xs md:text-sm mt-1 font-medium line-clamp-2">{item.desc}</CardDescription>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default OwnerHome;