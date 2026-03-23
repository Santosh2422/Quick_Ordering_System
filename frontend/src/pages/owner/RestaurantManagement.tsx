import { useEffect, useState } from "react";
import { Store, MapPin, Save, Pencil, Loader2, Image as ImageIcon, Map, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMyRestaurantApi, updateRestaurantApi } from "@/services/restaurant.service";
import { toast } from "sonner";

// --- TYPES ---
interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface RestaurantData {
  uid: string;
  name: string;
  description: string;
  image: string;
  address: Address;
}

const RestaurantManagement = () => {
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState<RestaurantData>({
    uid: "",
    name: "",
    description: "",
    image: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "India"
    }
  });

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await getMyRestaurantApi(); 
      if (res.data.success) {
        const data = res.data.restaurant;
        setFormData({
            uid: data.uid || "",
            name: data.name || "",
            description: data.description || "",
            image: data.image || "",
            address: {
                street: data.address?.street || "",
                city: data.address?.city || "",
                state: data.address?.state || "",
                zipCode: data.address?.zipCode || "",
                country: data.address?.country || "India"
            }
        });
      }
    } catch (error) {
      toast.error("Failed to fetch restaurant details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, []);

  const handleAddressChange = (field: keyof Address, value: string) => {
    setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [field]: value }
    }));
  };

  const handleUpdate = async () => {
    if (!formData.name || !formData.address.street || !formData.address.city) {
        toast.error("Name, Street, and City are required");
        return;
    }

    try {
      setLoading(true);
      const res = await updateRestaurantApi(formData);
      if (res.data.success) {
        toast.success("Restaurant updated successfully!");
        setIsEditing(false);
        fetchDetails(); 
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 pb-10 px-4 md:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl md:text-3xl font-bold text-orange-950 flex items-center gap-3">
             <Store className="w-7 h-7 md:w-8 md:h-8 text-orange-500" />
             Restaurant Details
           </h1>
           <p className="text-sm md:text-base text-muted-foreground mt-1">Manage your outlet's profile and location</p>
        </div>
        
        {!isEditing && (
            <Button onClick={() => setIsEditing(true)} className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20 rounded-xl h-11">
                <Pencil className="w-4 h-4 mr-2" /> Edit Details
            </Button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-orange-100 shadow-xl shadow-orange-900/5 overflow-hidden">
         
         {/* Top Banner / ID Section */}
         <div className="bg-orange-50/50 p-4 md:p-6 border-b border-orange-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-orange-400">UID:</span>
                <span className="font-mono bg-white px-2 py-1 rounded-md border border-orange-200 text-orange-950 font-bold text-sm md:text-lg">
                    {formData.uid || "..."}
                </span>
            </div>
            {isEditing && (
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="ghost" size="sm" className="flex-1 sm:flex-none text-red-500 hover:text-red-600" onClick={() => { setIsEditing(false); fetchDetails(); }} disabled={loading}>
                        <X className="w-4 h-4 mr-2" /> Cancel
                    </Button>
                    <Button size="sm" onClick={handleUpdate} disabled={loading} className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Save</>}
                    </Button>
                </div>
            )}
         </div>

         <div className="p-5 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
            
            {/* COLUMN 1: Basic Info & Image */}
            <div className="lg:col-span-1 space-y-6">
                {/* Image Preview */}
                <div className="aspect-video sm:aspect-square lg:aspect-video rounded-2xl bg-orange-50 border-2 border-dashed border-orange-200 flex items-center justify-center overflow-hidden relative">
                    {formData.image ? (
                        <img src={formData.image} alt="Restaurant" className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-center p-4">
                            <ImageIcon className="w-8 h-8 text-orange-200 mx-auto mb-2" />
                            <p className="text-xs text-orange-300 font-medium">No image provided</p>
                        </div>
                    )}
                </div>

                {/* Basic Fields */}
                <div className="space-y-5">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-orange-900/50 uppercase tracking-widest">Image URL</Label>
                        {isEditing ? (
                            <Input 
                                value={formData.image} 
                                onChange={(e) => setFormData({...formData, image: e.target.value})} 
                                placeholder="https://..."
                                className="text-xs h-10 rounded-xl"
                            />
                        ) : (
                            <p className="text-xs text-gray-400 truncate bg-gray-50 p-2 rounded-lg">{formData.image || "N/A"}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-orange-900/50 uppercase tracking-widest">Restaurant Name</Label>
                        {isEditing ? (
                            <Input 
                                value={formData.name} 
                                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                className="font-bold text-base md:text-lg border-orange-200 h-11 rounded-xl"
                            />
                        ) : (
                            <p className="text-xl md:text-2xl font-bold text-orange-950 leading-tight">{formData.name || "Unnamed Restaurant"}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-orange-900/50 uppercase tracking-widest">Description</Label>
                        {isEditing ? (
                            <textarea 
                                value={formData.description} 
                                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                                className="w-full p-3 rounded-xl border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm min-h-[120px] md:min-h-[150px] resize-none"
                                placeholder="Tell us about your restaurant..."
                            />
                        ) : (
                            <p className="text-sm text-gray-600 leading-relaxed bg-orange-50/30 p-4 rounded-2xl italic">
                                {formData.description ? `"${formData.description}"` : "No description provided"}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* COLUMN 2 & 3: Address Section */}
            <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-orange-100">
                    <MapPin className="w-5 h-5 text-orange-500" />
                    <h3 className="font-bold text-lg text-orange-950">Location Details</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                    {/* Street Address */}
                    <div className="sm:col-span-2 space-y-2">
                        <Label className="text-[10px] font-bold text-orange-900/50 uppercase tracking-widest">Street Address</Label>
                        {isEditing ? (
                            <Input 
                                value={formData.address.street} 
                                onChange={(e) => handleAddressChange('street', e.target.value)} 
                                className="border-orange-200 h-11 rounded-xl"
                                placeholder="e.g. 123 Food Street, Sector 4"
                            />
                        ) : (
                            <p className="text-base md:text-lg font-medium text-gray-800">{formData.address.street || "N/A"}</p>
                        )}
                    </div>

                    {/* City */}
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-orange-900/50 uppercase tracking-widest">City</Label>
                        {isEditing ? (
                            <Input 
                                value={formData.address.city} 
                                onChange={(e) => handleAddressChange('city', e.target.value)} 
                                className="border-orange-200 h-11 rounded-xl"
                            />
                        ) : (
                            <p className="text-base text-gray-700 capitalize">{formData.address.city || "N/A"}</p>
                        )}
                    </div>

                    {/* State */}
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-orange-900/50 uppercase tracking-widest">State</Label>
                        {isEditing ? (
                            <Input 
                                value={formData.address.state} 
                                onChange={(e) => handleAddressChange('state', e.target.value)} 
                                className="border-orange-200 h-11 rounded-xl"
                            />
                        ) : (
                            <p className="text-base text-gray-700">{formData.address.state || "N/A"}</p>
                        )}
                    </div>

                    {/* Zip Code */}
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-orange-900/50 uppercase tracking-widest">Zip Code</Label>
                        {isEditing ? (
                            <Input 
                                value={formData.address.zipCode} 
                                onChange={(e) => handleAddressChange('zipCode', e.target.value)} 
                                className="border-orange-200 h-11 rounded-xl"
                            />
                        ) : (
                            <p className="text-base text-gray-700 font-mono">{formData.address.zipCode || "N/A"}</p>
                        )}
                    </div>

                    {/* Country */}
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-orange-900/50 uppercase tracking-widest">Country</Label>
                        {isEditing ? (
                            <Input 
                                value={formData.address.country} 
                                onChange={(e) => handleAddressChange('country', e.target.value)} 
                                className="border-orange-200 bg-gray-50 h-11 rounded-xl"
                                disabled 
                            />
                        ) : (
                            <p className="text-base text-gray-700">{formData.address.country}</p>
                        )}
                    </div>
                </div>

                {/* Map Placeholder */}
                <div className="mt-4 md:mt-8 p-6 bg-orange-50 rounded-2xl border border-orange-100 flex flex-col items-center justify-center gap-3 text-orange-400 text-center">
                    <Map className="w-8 h-8 opacity-50" />
                    <div className="space-y-1">
                      <span className="text-sm font-bold block">Interactive Map</span>
                      <span className="text-xs opacity-70">Location visualization is coming in the next update</span>
                    </div>
                </div>
            </div>

         </div>
      </div>
    </div>
  );
};

export default RestaurantManagement;