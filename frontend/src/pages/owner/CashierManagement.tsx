import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getStaffApi,
  addStaffApi,
  approveStaffApi,
  deleteStaffApi,
  updateStaffApi, 
} from "@/services/staff.service";
import { 
  Trash2, 
  UserPlus, 
  ShieldCheck, 
  Mail, 
  Lock, 
  User, 
  Loader2, 
  Pencil, 
  X,
  Search
} from "lucide-react";
import { toast } from "sonner";

type Status = "PENDING" | "APPROVED";

interface Staff {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: Status;
}

const CashierManagement = () => {
  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Add Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("cashier");

  // Edit Modal State
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "",
    password: "" 
  });

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await getStaffApi();
      setStaffMembers(response.data.data);
    } catch (error) {
      console.error("Failed to fetch staff", error);
      toast.error("Could not load staff members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const addStaff = async () => {
    if (!name || !email || !password) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);
      await addStaffApi({ name, email, password, role });
      setName("");
      setEmail("");
      setPassword("");
      toast.success(`${role.toUpperCase()} account created! Status: PENDING`);
      fetchStaff();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add staff");
    } finally {
      setLoading(false);
    }
  };

  const approveStaff = async (id: string) => {
    try {
      await approveStaffApi(id);
      toast.success("Staff approved successfully");
      fetchStaff();
    } catch (error) {
      toast.error("Failed to approve staff");
    }
  };

  const removeStaff = async (id: string) => {
    if (!confirm("Are you sure you want to remove this staff member?")) return;
    try {
      await deleteStaffApi(id);
      toast.success("Staff member removed");
      fetchStaff();
    } catch (error) {
      toast.error("Failed to remove staff");
    }
  };

  const openEditModal = (staff: Staff) => {
    setEditingStaff(staff);
    setEditForm({
      name: staff.name,
      email: staff.email,
      role: staff.role,
      password: "" 
    });
  };

  const handleUpdate = async () => {
    if (!editingStaff) return;
    if (!editForm.name || !editForm.email) {
      toast.error("Name and Email are required");
      return;
    }

    try {
      setIsEditLoading(true);
      const payload: any = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
      };

      if (editForm.password.trim() !== "") {
        payload.password = editForm.password;
      }

      await updateStaffApi(editingStaff._id, payload);
      toast.success("Staff updated successfully");
      setEditingStaff(null);
      fetchStaff();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update staff");
    } finally {
      setIsEditLoading(false);
    }
  };

  const filteredStaff = staffMembers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6 md:space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3 text-slate-900">
          <ShieldCheck className="w-8 h-8 text-blue-600" /> Staff Management
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">Create and manage access for your restaurant team</p>
      </div>

      {/* ADD STAFF FORM */}
      <div className="bg-white p-4 md:p-6 rounded-2xl border shadow-sm space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-blue-600" /> Quick Add
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full h-11 px-3 py-2 bg-background border border-input rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="cashier">Cashier</option>
            <option value="kitchen">Kitchen Staff</option>
            <option value="staff">General Staff</option>
          </select>
          <Button onClick={addStaff} disabled={loading} className="w-full h-11 bg-blue-600 hover:bg-blue-700 sm:col-span-2 lg:col-span-1">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
          </Button>
        </div>
      </div>

      {/* SEARCH & LIST */}
      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search staff..." 
            className="pl-10" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredStaff.map((s) => (
            <div
              key={s._id}
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border p-4 md:p-5 rounded-2xl shadow-sm hover:shadow-md transition-all gap-4"
            >
              <div className="flex items-center gap-4 w-full min-w-0">
                <div className="w-12 h-12 flex-shrink-0 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xl">
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-lg truncate text-slate-900">{s.name}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                    <Mail className="w-3 h-3" /> {s.email}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      s.status === "APPROVED" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {s.status}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-blue-100 text-blue-700">
                      {s.role}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 w-full sm:w-auto justify-end border-t sm:border-none pt-3 sm:pt-0">
                {s.status === "PENDING" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 sm:flex-none border-green-600 text-green-600 hover:bg-green-50"
                    onClick={() => approveStaff(s._id)}
                  >
                    Approve
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                  onClick={() => openEditModal(s)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-gray-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => removeStaff(s._id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {filteredStaff.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed rounded-3xl text-muted-foreground bg-gray-50/50">
            <User className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>No staff members matching your search.</p>
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {editingStaff && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-300">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
              <h3 className="text-lg font-bold text-slate-800">Edit Staff Member</h3>
              <button onClick={() => setEditingStaff(null)} className="p-2 text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-gray-500">Full Name</label>
                <Input 
                  className="h-11"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-gray-500">Email Address</label>
                <Input 
                  className="h-11"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-gray-500">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                  className="w-full h-11 px-3 py-2 bg-background border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cashier">Cashier</option>
                  <option value="kitchen">Kitchen Staff</option>
                  <option value="staff">General Staff</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-gray-500">New Password (Optional)</label>
                <Input 
                  className="h-11"
                  type="password"
                  placeholder="Leave empty to keep current"
                  value={editForm.password}
                  onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                className="order-2 sm:order-1 h-11 sm:h-auto"
                onClick={() => setEditingStaff(null)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdate} 
                disabled={isEditLoading}
                className="bg-blue-600 hover:bg-blue-700 flex-1 order-1 sm:order-2 h-11 sm:h-auto"
              >
                {isEditLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashierManagement;