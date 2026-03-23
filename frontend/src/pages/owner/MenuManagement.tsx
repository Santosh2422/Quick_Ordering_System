import { useEffect, useState } from "react";
import { Plus, Trash2, Utensils, Pencil, Heart, Save, X, Image as ImageIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMyMenu, addMenu, updateMenuItemApi, deleteMenuItemApi, deleteCategoryApi } from "@/services/menu.service";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

/* ================= TYPES ================= */
type MenuItem = {
  _id: string;
  name: string;
  description: string;
  price: number | string;
  isVeg: boolean;
  isAvailable: boolean;
  image?: string;
  mostLoved?: boolean;
};

type Category = {
  _id: string;
  name: string;
  items: MenuItem[];
};

const MenuManagement = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemData, setNewItemData] = useState({
    name: "", description: "", price: "" as number | string, isVeg: true, image: "", mostLoved: false
  });
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const response = await getMyMenu();
      const menuData = response.data.menu || [];
      setCategories(menuData);
      if (menuData.length > 0) {
        if (selectedCategory) {
          const current = menuData.find((c: any) => c._id === selectedCategory._id);
          setSelectedCategory(current || menuData[0]);
        } else {
          setSelectedCategory(menuData[0]);
        }
      } else {
        setSelectedCategory(null);
      }
    } catch (err) {
      setError("Failed to load menu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMenu(); }, []);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      setLoading(true);
      const res = await addMenu({ categoryName: newCategoryName, items: [] });
      console.log("Res is: ", res);
      if (res.data.success) {
        setNewCategoryName("");
        setIsCreatingCategory(false);
        toast.success("Category created!");
        fetchMenu();
      }
    } catch (err) { toast.error("Failed to create category"); } 
    finally { setLoading(false); }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    if (!confirm(`Are you sure you want to delete the entire "${selectedCategory.name}" category?`)) return;
    try {
      setLoading(true);
      await deleteCategoryApi(selectedCategory._id);
      fetchMenu();
      toast.success("Category deleted");
    } catch (err) { toast.error("Failed to delete category"); } 
    finally { setLoading(false); }
  };

  const handleSaveNewItem = async () => {
    if (!selectedCategory || !newItemData.name) return;
    try {
      setLoading(true);
      const res = await addMenu({
        categoryName: selectedCategory.name,
        items: [{ ...newItemData, price: Number(newItemData.price), isAvailable: true }]
      });
      if (res.data.success) {
        toast.success("Item added!");
        setIsAddingItem(false);
        setNewItemData({ name: "", description: "", price: "", isVeg: true, image: "", mostLoved: false });
        fetchMenu();
      }
    } catch (err) { toast.error("Failed to add item"); } 
    finally { setLoading(false); }
  };

  const startEditing = (item: MenuItem) => { setEditingItem({ ...item }); };

  const handleEditChange = (field: keyof MenuItem, value: any) => {
    if (!editingItem) return;
    setEditingItem({ ...editingItem, [field]: field === 'price' ? (value === "" ? "" : Number(value)) : value });
  };

  const saveEdits = async () => {
    if (!selectedCategory || !editingItem) return;
    try {
      await updateMenuItemApi({
        categoryId: selectedCategory._id,
        itemId: editingItem._id,
        updateData: { ...editingItem, price: Number(editingItem.price) }
      });
      toast.success("Changes saved!");
      setEditingItem(null); 
      fetchMenu();
    } catch (err) { toast.error("Failed to save changes"); }
  };

  const handleDeleteItem = async (categoryId: string, itemId: string) => {
    if (!confirm("Delete this item?")) return;
    try {
      await deleteMenuItemApi({ categoryId, itemId });
      fetchMenu();
      toast.success("Item deleted");
    } catch (err) { toast.error("Delete failed"); }
  };

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-6 sm:space-y-8 bg-[#FFFBF0]/50 rounded-2xl sm:rounded-[3rem]">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-center gap-4 p-2 sm:p-4">
        <div className="p-3 bg-orange-500 rounded-2xl shadow-lg text-white">
          <Utensils className="w-6 h-6 sm:w-8 sm:h-8" />
        </div>
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-4xl font-bold text-orange-950">Kitchen Management</h1>
          <p className="text-sm sm:text-base text-orange-800/60 font-medium">Curate your culinary offerings</p>
        </div>
      </div>

      {/* CATEGORY SELECTOR - Scrollable on mobile */}
      <div className="flex flex-col gap-4 bg-white/80 backdrop-blur-sm p-4 sm:p-6 rounded-3xl border border-orange-50 shadow-xl overflow-hidden">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2 sm:pb-0">
          {!isCreatingCategory ? (
            <Button onClick={() => setIsCreatingCategory(true)} size="sm" className="h-10 sm:h-12 bg-orange-500 hover:bg-orange-600 rounded-2xl px-4 flex-shrink-0">
              <Plus className="w-4 h-4 mr-1" /> Category
            </Button>
          ) : (
            <div className="flex items-center gap-2 flex-shrink-0 animate-in fade-in slide-in-from-left-2">
              <Input
                autoFocus
                placeholder="Name..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-32 h-10 sm:h-12 rounded-xl border-orange-100"
              />
              <Button onClick={handleCreateCategory} size="icon" className="h-10 w-10 sm:h-12 sm:w-12 bg-green-500 rounded-xl"><Check className="w-4 h-4" /></Button>
              <Button onClick={() => setIsCreatingCategory(false)} variant="ghost" size="icon" className="h-10 w-10 text-red-500"><X className="w-4 h-4" /></Button>
            </div>
          )}

          <div className="h-8 w-px bg-orange-100 mx-2 hidden sm:block" />

          {categories.map((cat) => (
            <Button
              key={cat._id}
              variant={selectedCategory?._id === cat._id ? "default" : "ghost"}
              onClick={() => { setSelectedCategory(cat); setIsAddingItem(false); setEditingItem(null); }}
              className={`rounded-full px-4 sm:px-6 capitalize h-9 sm:h-11 font-bold whitespace-nowrap flex-shrink-0 ${selectedCategory?._id === cat._id ? "bg-orange-500 shadow-md" : "text-orange-900/40"}`}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      {/* MENU ITEMS AREA */}
      <div className="space-y-6 sm:space-y-8 px-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-orange-100 pb-4">
          <div className="flex flex-col sm:flex-row items-baseline gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-orange-950 capitalize truncate">
              {selectedCategory?.name || "Select a category"}
            </h2>
            {selectedCategory && (
              <div className="flex items-center gap-3">
                <span className="text-[10px] sm:text-sm font-medium text-orange-400 bg-orange-50 px-2 py-0.5 rounded-full">{selectedCategory.items.length} Items</span>
                <button onClick={handleDeleteCategory} className="text-red-400 hover:text-red-600 text-xs flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            )}
          </div>

          {selectedCategory && !isAddingItem && (
            <Button onClick={() => setIsAddingItem(true)} className="bg-orange-600 hover:bg-orange-700 h-10 sm:h-11 w-full sm:w-auto rounded-2xl font-bold">
              <Plus className="w-4 h-4 mr-2" /> Add Dish
            </Button>
          )}
        </div>

        {/* --- ADD NEW ITEM FORM --- */}
        {isAddingItem && selectedCategory && (
          <div className="bg-white p-4 sm:p-8 rounded-3xl border-2 border-orange-100 shadow-2xl space-y-6 animate-in zoom-in-95">
            <div className="flex justify-between items-center">
              <h3 className="text-lg sm:text-xl font-bold text-orange-950">Add New Dish</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsAddingItem(false)}><X className="w-5 h-5"/></Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-4">
                <Input placeholder="Dish Name" value={newItemData.name} onChange={e => setNewItemData({...newItemData, name: e.target.value})} className="h-11 sm:h-12 rounded-xl border-orange-100" />
                <textarea placeholder="Description" value={newItemData.description} onChange={e => setNewItemData({...newItemData, description: e.target.value})} className="w-full h-24 p-4 rounded-xl border border-orange-100 text-sm resize-none focus:outline-orange-500" />
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-300" />
                  <Input placeholder="Image URL (https://...)" value={newItemData.image} onChange={e => setNewItemData({...newItemData, image: e.target.value})} className="h-11 sm:h-12 pl-10 rounded-xl border-orange-100" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Price" type="number" value={newItemData.price} onChange={e => setNewItemData({...newItemData, price: e.target.value})} className="h-11 sm:h-12 rounded-xl border-orange-100 font-bold" />
                  <div className="flex p-1 bg-orange-50 rounded-xl border border-orange-100">
                    <button onClick={() => setNewItemData({...newItemData, isVeg: true})} className={`flex-1 rounded-lg text-xs font-bold transition-all ${newItemData.isVeg ? "bg-white text-green-600 shadow-sm" : "text-orange-300"}`}>Veg</button>
                    <button onClick={() => setNewItemData({...newItemData, isVeg: false})} className={`flex-1 rounded-lg text-xs font-bold transition-all ${!newItemData.isVeg ? "bg-white text-red-600 shadow-sm" : "text-orange-300"}`}>Non</button>
                  </div>
                </div>
                <button onClick={() => setNewItemData({...newItemData, mostLoved: !newItemData.mostLoved})} className={`w-full h-11 sm:h-12 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all ${newItemData.mostLoved ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white text-gray-400'}`}>
                  <Heart className={`w-4 h-4 ${newItemData.mostLoved ? 'fill-red-600' : ''}`} /> Most Loved
                </button>
                <Button onClick={handleSaveNewItem} className="w-full bg-orange-500 h-11 sm:h-12 rounded-xl font-bold shadow-lg shadow-orange-500/20">Save Dish</Button>
              </div>
            </div>
          </div>
        )}

        {/* ITEM GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {selectedCategory?.items.map((item) => {
            const isEditing = editingItem?._id === item._id;
            const displayItem = isEditing ? editingItem : item;

            return (
              <div key={item._id} className={`bg-white rounded-[2rem] overflow-hidden border transition-all duration-300 ${isEditing ? 'border-orange-400 ring-4 ring-orange-400/10 z-10' : 'border-orange-50 shadow-lg hover:shadow-2xl hover:-translate-y-1'}`}>
                
                <div className="relative h-40 sm:h-48 overflow-hidden bg-orange-50 group">
                  <img src={displayItem.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400"} alt={displayItem.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    <div className={`p-1 rounded-full border-2 bg-white/90 ${displayItem.isVeg ? "border-green-500" : "border-red-500"}`}>
                      <div className={`w-2 h-2 rounded-full ${displayItem.isVeg ? "bg-green-500" : "bg-red-500"}`} />
                    </div>
                  </div>

                  <div className="absolute top-3 right-3 flex gap-2">
                    {!isEditing ? (
                      <>
                        <Button size="icon" className="h-8 w-8 rounded-lg bg-white/90 text-orange-900 sm:opacity-0 sm:group-hover:opacity-100 transition-all" onClick={() => startEditing(item)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="destructive" size="icon" className="h-8 w-8 rounded-lg sm:opacity-0 sm:group-hover:opacity-100 transition-all" onClick={() => handleDeleteItem(selectedCategory._id, item._id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    ) : (
                      <Button size="icon" className="h-8 w-8 rounded-lg bg-green-500 text-white" onClick={saveEdits}>
                        <Save className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="p-4 sm:p-6 space-y-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      <Input value={editingItem!.name} onChange={(e) => handleEditChange('name', e.target.value)} className="font-bold text-sm h-9" />
                      <Input value={editingItem!.description} onChange={(e) => handleEditChange('description', e.target.value)} className="text-xs h-9" />
                      <div className="grid grid-cols-2 gap-2">
                        <Input type="number" value={editingItem!.price} onChange={(e) => handleEditChange('price', e.target.value)} className="h-9 text-xs" />
                        <div className="flex h-9 border rounded-lg bg-orange-50 overflow-hidden">
                          <button onClick={() => handleEditChange('isVeg', true)} className={`flex-1 text-[9px] font-bold ${editingItem!.isVeg ? 'bg-white text-green-600 shadow-sm' : 'text-gray-400'}`}>Veg</button>
                          <button onClick={() => handleEditChange('isVeg', false)} className={`flex-1 text-[9px] font-bold ${!editingItem!.isVeg ? 'bg-white text-red-600 shadow-sm' : 'text-gray-400'}`}>Non</button>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEditChange('isAvailable', !editingItem!.isAvailable)} className={`flex-1 p-1.5 rounded-lg border text-[9px] font-bold uppercase ${editingItem!.isAvailable ? 'bg-green-50 text-green-700' : 'bg-gray-50'}`}>Available</button>
                        <button onClick={() => handleEditChange('mostLoved', !editingItem!.mostLoved)} className={`flex-1 p-1.5 rounded-lg border text-[9px] font-bold uppercase flex justify-center items-center gap-1 ${editingItem!.mostLoved ? 'bg-red-50 text-red-600' : 'bg-white'}`}>
                          <Heart className={`w-2.5 h-2.5 ${editingItem!.mostLoved ? 'fill-red-600' : ''}`} /> Loved
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-base sm:text-lg text-orange-950 leading-tight truncate">{item.name}</h3>
                        <span className="font-black text-base sm:text-lg text-orange-600">₹{item.price}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-orange-900/60 font-medium line-clamp-2 min-h-[2.5rem]">{item.description}</p>
                      <div className="flex items-center justify-between pt-3 border-t border-dashed border-orange-100">
                        <span className={`text-[10px] sm:text-xs font-bold ${item.isAvailable ? 'text-green-600' : 'text-gray-400'}`}>
                          {item.isAvailable ? '• Available' : '• Out of Stock'}
                        </span>
                        {item.mostLoved && <Heart className="w-3 h-3 sm:w-4 sm:h-4 fill-red-500 text-red-500" />}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MenuManagement;