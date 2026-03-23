import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Search, Loader2, Utensils, Leaf, Beef, 
  ShoppingBag, Plus, ClipboardList, Store 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryTabs } from "@/components/CategoryTabs";

import { getPublicMenu } from "@/services/menu.service";
import { useSession } from "@/context/SessionContext";
import { useCart } from "@/context/CartContext";

/* ---------- TYPES ---------- */
type MenuItem = {
  _id: string;
  name: string;
  description?: string;
  categoryName?: string;
  price: number;
  isVeg: boolean;
  isAvailable: boolean;
  image?: string;
  preparationTime?: number;
};

type Category = {
  _id: string;
  name: string;
  items: MenuItem[];
};

type FoodType = "ALL" | "VEG" | "NON_VEG";

const Menu = () => {
  const navigate = useNavigate();
  const initializedRef = useRef(false);

  const { session, updateSession } = useSession();
  const { addItem, cartItems, totalPrice, setTableNumber } = useCart();

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [foodType, setFoodType] = useState<FoodType>("ALL");

  // --- RESTAURANT STATE ---
  const [restaurant, setRestaurant] = useState<any>(null);

  /* ---------- FETCH PUBLIC MENU & RESTAURANT DETAILS ---------- */
  const fetchMenuData = async () => {
    if (!session.restaurantId) return;
    try {
      setLoading(true);
      
      // Fetching from Public API to avoid 401 redirects
      const response = await getPublicMenu(session.restaurantId, session.tableId || "");
      
      // 1. Set Menu Categories
      setCategories(response.data.menu || []);

      // 2. Set Restaurant Details & Sync to Session for Cart/Orders access
      if (response.data.restaurant) {
        const restInfo = {
          name: response.data.restaurant.name,
          image: response.data.restaurant.image || response.data.restaurant.logo
        };
        
        setRestaurant(restInfo);
        
        // This persists the data in SessionContext so Cart.tsx doesn't need to fetch it
        updateSession({ restaurantDetails: restInfo });
      }

      // 3. Sync Table Info
      if (response.data.tableName && !session.tableName) {
        updateSession({ tableName: response.data.tableName });
      }
    } catch (error) {
      console.error("Failed to fetch menu data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuData();
  }, [session.restaurantId]);

  /* ---------- SESSION GUARD ---------- */
  useEffect(() => {
    if (!session.tableId || !session.restaurantId) {
      const timer = setTimeout(() => {
         navigate("/scan-table", { replace: true });
      }, 500);
      return () => clearTimeout(timer);
    }

    if (!initializedRef.current && session.status === "ACTIVE") {
      initializedRef.current = true;
      setTableNumber(session.tableName || session.tableId || "");
    }
  }, [session, navigate, setTableNumber]);

  /* ---------- FILTER MENU ---------- */
  const allItems = categories.flatMap(cat =>
    cat.items.map(item => ({ ...item, categoryId: cat._id, categoryName: cat.name }))
  );

  const filteredItems = allItems.filter((item) => {
    const matchCategory = selectedCategory === "all" || item.categoryId === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchSearch = !q || item.name.toLowerCase().includes(q) || (item.description ?? "").toLowerCase().includes(q);
    const matchFood = foodType === "ALL" || (foodType === "VEG" && item.isVeg) || (foodType === "NON_VEG" && !item.isVeg);
    return matchCategory && matchSearch && matchFood;
  });

  const handleAddToCart = (item: any) => {
    addItem({
      id: item._id,
      name: item.name,
      description: item.description || item.name,
      price: item.price,
      image: item.image,
      isVeg: item.isVeg,
      category: item.categoryName || "General",
      isAvailable: item.isAvailable,
      preparationTime: item.preparationTime || 15,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFBF0]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto" />
          <p className="text-orange-900/40 font-bold animate-pulse uppercase tracking-widest">Preparing Menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBF0] pb-32">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-orange-100 shadow-xl shadow-orange-900/5">
        <div className="container py-4 flex justify-between items-center px-4 md:px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/scan-table")}
            className="text-orange-950 hover:bg-orange-50 rounded-xl px-2 sm:px-3"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            <span className="hidden sm:inline">Scan</span>
          </Button>

          {/* BRANDING */}
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 shrink-0 rounded-lg bg-orange-100 border border-orange-200 flex items-center justify-center overflow-hidden relative shadow-inner">
               {restaurant?.image ? (
                 <img src={restaurant.image} alt="Logo" className="w-full h-full object-cover" />
               ) : (
                 <Store className="w-5 h-5 text-orange-600" />
               )}
            </div>
            
            <div className="flex flex-col min-w-0">
               <h1 className="font-bold text-base sm:text-lg leading-tight text-gray-900 truncate uppercase tracking-tight">
                 {restaurant?.name || "Our Restaurant"}
               </h1>
               <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest leading-none">Digital Menu</p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <p className="text-sm font-black text-orange-950 uppercase tracking-tighter italic leading-none">
              {session.tableName || `T-${session.tableId}`}
            </p>
            <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest mt-1">Table</p>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="container px-4 md:px-6 mb-4 flex gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-300" />
            <Input
              className="pl-11 h-12 rounded-2xl border-orange-100 bg-orange-50/20 focus-visible:ring-orange-500 font-medium placeholder:text-orange-200"
              placeholder="Hungry for something?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex bg-white rounded-2xl p-1 border border-orange-100 shadow-sm shrink-0">
            <button
              onClick={() => setFoodType("VEG")}
              className={`p-2.5 rounded-xl transition-all ${foodType === "VEG" ? "bg-green-100 text-green-600 shadow-inner" : "text-gray-300 hover:text-green-400"}`}
            >
              <Leaf className="w-5 h-5" />
            </button>
            <button
              onClick={() => setFoodType("NON_VEG")}
              className={`p-2.5 rounded-xl transition-all ${foodType === "NON_VEG" ? "bg-red-100 text-red-600 shadow-inner" : "text-gray-300 hover:text-red-400"}`}
            >
              <Beef className="w-5 h-5" />
            </button>
            <button
              onClick={() => setFoodType("ALL")}
              className={`p-2.5 rounded-xl transition-all ${foodType === "ALL" ? "bg-orange-100 text-orange-600 shadow-inner" : "text-gray-300 hover:text-orange-400"}`}
            >
              <Utensils className="w-5 h-5" />
            </button>
          </div>
        </div>

        <CategoryTabs
          categories={categories.map(cat => ({ ...cat, id: cat._id }))}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </header>

      {/* MENU GRID */}
      <main className="container py-6 grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 px-4 md:px-6">
        {filteredItems.map((item) => (
          <div key={item._id} className="bg-white rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-xl shadow-orange-900/5 group hover:shadow-2xl hover:shadow-orange-900/10 transition-all duration-500 border border-orange-50 flex flex-col">
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400"}
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute top-3 left-3">
                <div className={`p-1 rounded-full border-2 bg-white/80 backdrop-blur-sm ${item.isVeg ? "border-green-500" : "border-red-500"}`}>
                  <div className={`w-2 h-2 rounded-full ${item.isVeg ? "bg-green-500" : "bg-red-500"}`}></div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 flex-1 flex flex-col space-y-1.5">
              <h3 className="font-bold text-sm sm:text-lg text-orange-950 leading-tight line-clamp-1 uppercase tracking-tight">
                {item.name}
              </h3>
              {item.description && (
                <p className="text-[10px] sm:text-xs font-medium text-orange-800/40 line-clamp-2 italic">
                  {item.description}
                </p>
              )}
              
              <div className="mt-auto pt-3 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-black text-orange-200 tracking-widest leading-none">Price</span>
                  <span className="font-black text-lg sm:text-xl text-orange-950">₹{item.price}</span>
                </div>
                <button
                  disabled={!item.isAvailable}
                  onClick={() => handleAddToCart(item)}
                  className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20 flex items-center justify-center active:scale-90 transition-all disabled:opacity-50"
                >
                  <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {filteredItems.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <Utensils className="w-12 h-12 text-orange-100 mx-auto mb-4" />
            <p className="text-orange-900/40 font-bold uppercase tracking-widest">No items found</p>
          </div>
        )}
      </main>

      {/* FLOATING MY ORDERS BUTTON */}
      <div className={`fixed transition-all duration-500 ease-in-out z-50 ${cartItems.length > 0 ? 'bottom-28 sm:bottom-32' : 'bottom-8'} right-4 sm:right-6`}>
        <button
          onClick={() => navigate("/orders")}
          className="group relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-white border-4 border-orange-100 text-orange-600 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300"
        >
          <ClipboardList className="w-6 h-6 sm:w-7 sm:h-7" />
          <span className="absolute -top-10 right-0 bg-orange-950 text-white text-[9px] font-black px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap tracking-widest uppercase shadow-xl">
            My Orders
          </span>
          <span className="absolute inset-0 rounded-full border-2 border-orange-500/20 animate-ping opacity-20 group-hover:hidden"></span>
        </button>
      </div>

      {/* CART BAR */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-lg z-50 animate-in slide-in-from-bottom duration-500">
          <div className="bg-orange-600 rounded-[2rem] p-3 sm:p-4 shadow-2xl flex justify-between items-center text-white border-2 border-white/20">
            <div className="flex items-center gap-3 sm:gap-4 pl-1 sm:pl-2">
              <div className="bg-white/20 p-2 sm:p-3 rounded-2xl hidden xs:block">
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold tracking-widest opacity-70">
                  {cartItems.length} ITEM{cartItems.length > 1 ? "S" : ""}
                </span>
                <span className="font-black text-xl sm:text-2xl leading-none">₹{totalPrice}</span>
              </div>
            </div>
            <Button 
              onClick={() => navigate("/cart")} 
              className="bg-white hover:bg-orange-50 text-orange-600 h-12 sm:h-14 px-6 sm:px-8 rounded-2xl font-black text-base sm:text-lg shadow-lg active:scale-95 transition-transform"
            >
              Order Now
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;