import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/context/SessionContext";
import { Phone, ArrowRight, UtensilsCrossed } from "lucide-react";
import { RestaurantLogo } from "@/components/RestaurantLogo";

const CustomerEntry = () => {
  const navigate = useNavigate();
  const { setCustomerPhone } = useSession();

  const [phone, setPhone] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setCustomerPhone(phone.trim());
    navigate("/scan-table");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFBF0] px-4 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100 rounded-full blur-3xl -mr-32 -mt-32 opacity-40"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-50 rounded-full blur-3xl -ml-32 -mb-32 opacity-40"></div>

      <div className="w-full max-w-md space-y-8 z-10">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-white rounded-3xl shadow-xl shadow-orange-200">
              <UtensilsCrossed className="w-12 h-12 text-orange-500" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-orange-950 font-display">Welcome!</h1>
            <p className="text-orange-800/70 font-medium">To provide the best experience, please enter your details</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-[2rem] shadow-2xl shadow-orange-900/5 space-y-6 border border-orange-50"
        >
          <div className="space-y-2">
            <label className="text-sm font-bold text-orange-900 ml-1">Mobile Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-300" />
              <Input
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-14 pl-12 rounded-2xl border-orange-100 focus-visible:ring-orange-500 text-lg font-medium"
                required
                pattern="[0-9]{10}"
              />
            </div>
            <p className="text-[10px] text-orange-400 mt-1 ml-1 font-medium italic">We'll use this to track your order activity.</p>
          </div>

          <Button type="submit" className="w-full h-14 bg-orange-500 hover:bg-orange-600 rounded-2xl text-lg font-bold shadow-lg shadow-orange-200 group">
            Continue to Scan
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </form>

        <div className="text-center">
          <p className="text-xs text-orange-300 font-medium">By continuing, you agree to our Terms of Service</p>
        </div>
      </div>
    </div>
  );
};

export default CustomerEntry;

