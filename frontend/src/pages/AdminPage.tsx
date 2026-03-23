// src/pages/AdminPage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
// Icons
import { 
  Trash2, UserPlus, RefreshCcw, LogOut, 
  Store, MapPin, UserCog, Info, ShieldCheck
} from "lucide-react";
// Services
import { 
  addUserApi, 
  getAllUsersApi, 
  getRestaurantsApi, 
  createRestaurantApi,
  updateRole
} from "@/services/admin.service";
import { toast } from "sonner";

type UserRecord = {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
};

const AdminPage = () => {
  const navigate = useNavigate();
  const { logout, user: currentUser } = useAuth();
  
  // Data States
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  
  // Loading States
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [restLoading, setRestLoading] = useState(false);
  const [roleUpdateLoading, setRoleUpdateLoading] = useState(false);

  // Modal State
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Form States
  const [newUser, setNewUser] = useState({
    name: "", email: "", username: "", password: "", role: "owner", restaurantId: ""
  });

  const [newRestaurant, setNewRestaurant] = useState({
    name: "", description: "",
    address: { street: "", city: "", state: "", zipCode: "" },
    ownerId: ""
  });

  const [roleUpdate, setRoleUpdate] = useState({
    email: "",
    role: "owner"
  });

  // --- Data Fetching ---
  const fetchRestaurants = async () => {
    try {
      const res = await getRestaurantsApi();
      if (res.data.success) setRestaurants(res.data.data);
    } catch (error) {
      console.error("Failed to fetch restaurants");
    }
  };

  const fetchUsers = async () => {
    try {
      setFetching(true);
      const res = await getAllUsersApi();
      if (res.data.success) {
        setUsers(res.data.users.map((u: any) => ({
          id: u._id || u.id,
          name: u.name,
          email: u.email,
          username: u.username,
          role: u.role
        })));
      }
    } catch (error) {
      toast.error("Failed to fetch users");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRestaurants();
  }, []);

  // --- Handlers ---
  const handleUpdateUserRole = async () => {
    if (!roleUpdate.email) {
      toast.error("Please enter an email address");
      return;
    }
    try {
      setRoleUpdateLoading(true);
      const res = await updateRole(roleUpdate); 
      if (res.data.success) {
        toast.success(`User role updated to ${roleUpdate.role.toUpperCase()} successfully!`);
        setRoleUpdate({ email: "", role: "owner" });
        fetchUsers(); 
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "User update failed");
    } finally {
      setRoleUpdateLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.username || !newUser.password) {
      toast.error("Please fill all fields");
      return;
    }
    try {
      setLoading(true);
      const res = await addUserApi(newUser);
      if (res.data.success) {
        toast.success(res.data.message);
        setNewUser({ name: "", email: "", username: "", password: "", role: "owner", restaurantId: "" });
        fetchUsers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const handleAddRestaurant = async () => {
    if (!newRestaurant.name || !newRestaurant.address.street || !newRestaurant.address.city) {
      toast.error("Restaurant name and basic address are required");
      return;
    }
    try {
      setRestLoading(true);
      const res = await createRestaurantApi(newRestaurant);
      if (res.data.success) {
        toast.success("Restaurant created successfully!");
        setNewRestaurant({
          name: "", description: "",
          address: { street: "", city: "", state: "", zipCode: "" },
          ownerId: ""
        });
        fetchRestaurants();
        fetchUsers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setRestLoading(false);
    }
  };

  const openRestaurantDetails = (restaurant: any) => {
    setSelectedRestaurant(restaurant);
    setIsDetailsOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-8 text-left pb-16 md:pb-8">
      <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-indigo-600" /> System Admin
            </h1>
            <p className="text-slate-500 font-medium text-sm md:text-base">Manage system infrastructure and access</p>
          </div>
          <div className="flex items-center justify-between md:justify-end gap-3 bg-white p-2 rounded-2xl border md:border-none md:bg-transparent">
            <div className="text-left px-2 sm:px-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Administrator</p>
              <p className="text-xs md:text-sm font-medium text-slate-600 truncate max-w-[140px]">{currentUser?.email}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={() => { fetchUsers(); fetchRestaurants(); }} disabled={fetching}>
                <RefreshCcw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                className="h-10 w-10 rounded-xl shadow-lg shadow-red-200"
                onClick={() => { logout(); navigate("/login"); }}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* SECTION 1: ROLE MANAGEMENT */}
        <Card className="border-none shadow-xl shadow-indigo-100/50 rounded-[2rem] bg-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 md:w-2 md:h-full bg-indigo-500"></div>
          <CardHeader className="px-6 pt-8 md:pt-6">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-indigo-900">
              <UserCog className="w-6 h-6 text-indigo-500" /> Update User Role
            </CardTitle>
            <CardDescription>Update permissions for existing system users</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-end">
              <div className="w-full lg:flex-1 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">User Email</label>
                <Input 
                  placeholder="user@example.com" 
                  className="rounded-xl border-slate-200 h-11 md:h-12"
                  value={roleUpdate.email}
                  onChange={(e) => setRoleUpdate({...roleUpdate, email: e.target.value})}
                />
              </div>
              <div className="w-full lg:w-72 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Assign New Role</label>
                <Select value={roleUpdate.role} onValueChange={(val) => setRoleUpdate({...roleUpdate, role: val})}>
                  <SelectTrigger className="rounded-xl border-slate-200 h-11 md:h-12 font-medium">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="owner">Owner (Full Access)</SelectItem>
                    <SelectItem value="cashier">Cashier</SelectItem>
                    <SelectItem value="kitchen">Kitchen</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                className="h-11 md:h-12 w-full lg:w-auto px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg font-bold"
                onClick={handleUpdateUserRole}
                disabled={roleUpdateLoading}
              >
                {roleUpdateLoading ? "Updating..." : "Update Role"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: CREATION FORMS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Create Restaurant Form */}
          <Card className="border-none shadow-xl shadow-slate-200/60 rounded-[2rem] bg-white">
            <CardHeader className="px-6 pt-8">
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                <Store className="w-5 h-5 text-orange-500" /> New Restaurant
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-8 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Establishment Name</label>
                  <Input className="rounded-xl border-slate-100 bg-slate-50/50 h-11" value={newRestaurant.name} onChange={(e) => setNewRestaurant({ ...newRestaurant, name: e.target.value })} />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Business Slogan/Desc</label>
                  <Input className="rounded-xl border-slate-100 bg-slate-50/50 h-11" value={newRestaurant.description} onChange={(e) => setNewRestaurant({ ...newRestaurant, description: e.target.value })} />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Street</label>
                  <Input className="rounded-xl border-slate-100 bg-slate-50/50 h-11" value={newRestaurant.address.street} onChange={(e) => setNewRestaurant({ ...newRestaurant, address: { ...newRestaurant.address, street: e.target.value } })} />
                </div>
                <div className="space-y-1.5">
                  <Input className="rounded-xl border-slate-100 bg-slate-50/50 h-11" placeholder="City" value={newRestaurant.address.city} onChange={(e) => setNewRestaurant({ ...newRestaurant, address: { ...newRestaurant.address, city: e.target.value } })} />
                </div>
                <div className="space-y-1.5">
                   <Input className="rounded-xl border-slate-100 bg-slate-50/50 h-11" placeholder="State" value={newRestaurant.address.state} onChange={(e) => setNewRestaurant({ ...newRestaurant, address: { ...newRestaurant.address, state: e.target.value } })} />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Assigned Owner</label>
                  <Select value={newRestaurant.ownerId || "none"} onValueChange={(val) => setNewRestaurant({ ...newRestaurant, ownerId: val === "none" ? "" : val })}>
                    <SelectTrigger className="rounded-xl border-slate-100 bg-slate-50/50 h-11 font-medium"><SelectValue placeholder="Optional Owner" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Register to Self</SelectItem>
                      {users.filter(u => u.role === 'owner').map((u) => (<SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleAddRestaurant} disabled={restLoading} className="w-full h-12 md:h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 font-bold text-lg active:scale-95 transition-all">
                {restLoading ? "Launching..." : "Launch Restaurant"}
              </Button>
            </CardContent>
          </Card>

          {/* Create User Form */}
          <Card className="border-none shadow-xl shadow-slate-200/60 rounded-[2rem] bg-white">
            <CardHeader className="px-6 pt-8">
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                <UserPlus className="w-5 h-5 text-indigo-600" /> New Credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-8 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <Input className="rounded-xl border-slate-100 bg-slate-50/50 h-11" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Username</label>
                  <Input className="rounded-xl border-slate-100 bg-slate-50/50 uppercase h-11" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value.toUpperCase() })} />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email</label>
                  <Input className="rounded-xl border-slate-100 bg-slate-50/50 h-11" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Role Type</label>
                  <Select value={newUser.role} onValueChange={(val) => setNewUser({ ...newUser, role: val })}>
                    <SelectTrigger className="rounded-xl border-slate-100 bg-slate-50/50 h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="cashier">Cashier</SelectItem>
                      <SelectItem value="kitchen">Kitchen Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Access Password</label>
                  <Input type="password" className="rounded-xl border-slate-100 bg-slate-50/50 h-11" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
                </div>
              </div>
              <Button onClick={handleAddUser} disabled={loading} className="w-full h-12 md:h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold text-lg active:scale-95 transition-all">
                {loading ? "Generating..." : "Generate Account"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* SECTION 3: ESTABLISHMENT LIST */}
        <Card className="border-none shadow-2xl shadow-slate-200/60 rounded-[2rem] overflow-hidden bg-white">
          <CardHeader className="px-6 py-6 border-b border-slate-50 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Store className="w-5 h-5 text-slate-400" /> Registry
            </CardTitle>
            <span className="text-[10px] px-3 py-1 bg-orange-50 text-orange-600 rounded-full font-black uppercase tracking-widest">
              {restaurants.length} Total
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto no-scrollbar">
              {restaurants.length === 0 && !fetching ? (
                <div className="p-16 text-center text-slate-400 font-medium italic">No active data found.</div>
              ) : (
                restaurants.map((rest) => (
                  <div key={rest.uid} className="group p-5 hover:bg-orange-50/40 transition-all cursor-pointer flex items-center justify-between gap-4" onClick={() => openRestaurantDetails(rest)}>
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 flex-shrink-0 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                        <Store className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 truncate">{rest.name}</h3>
                        <p className="text-[10px] text-slate-400 font-medium truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {rest.address?.city}, {rest.address?.state}
                        </p>
                      </div>
                    </div>
                    <Info className="w-5 h-5 text-slate-300 group-hover:text-orange-400 flex-shrink-0" />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- DETAILS MODAL --- */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[500px] w-[92vw] rounded-[2rem] p-0 overflow-hidden outline-none">
          <div className="h-1.5 w-full bg-orange-500" />
          <div className="p-6 md:p-8 space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <Store className="w-7 h-7 text-orange-500" /> {selectedRestaurant?.name}
              </DialogTitle>
              <DialogDescription>Registry Database Details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">About</h4>
                  <p className="text-sm text-slate-700 leading-relaxed">{selectedRestaurant?.description || "No description provided."}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200/60 mt-4">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">System UID</h4>
                    <p className="text-[11px] font-mono bg-white p-2 rounded-lg border border-slate-200 truncate">{selectedRestaurant?.uid}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Owner Ref</h4>
                    <p className="text-[11px] font-mono bg-white p-2 rounded-lg border border-slate-200 truncate">{selectedRestaurant?.owner || "N/A"}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2 flex items-center gap-1"><MapPin className="w-3 h-3" /> Location</h4>
                <p className="text-sm font-bold text-slate-800">{selectedRestaurant?.address?.street}</p>
                <p className="text-sm text-slate-600">{selectedRestaurant?.address?.city}, {selectedRestaurant?.address?.state} {selectedRestaurant?.address?.zipCode}</p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsDetailsOpen(false)} className="w-full h-12 rounded-xl bg-slate-900 hover:bg-black font-bold">Close Record</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPage;