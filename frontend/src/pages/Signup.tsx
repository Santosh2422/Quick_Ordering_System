import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RestaurantLogo } from "@/components/RestaurantLogo";
import { UserPlus, Mail, Lock, User as UserIcon, EyeOff, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";

const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "customer" as "customer" | "owner"
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signup({ ...formData });
      toast.success("Account created successfully! Welcome to our family.");

      if (formData.role === 'owner') {
        navigate("/owner");
      } else {
        navigate("/home");
      }
    } catch (error: any) {
      toast.error(error.message || "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF0] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] sm:w-[40%] h-[40%] bg-orange-100 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] sm:w-[30%] h-[30%] bg-orange-50 rounded-full blur-3xl opacity-50" />

      <div className="w-full max-w-md space-y-6 sm:space-y-8 z-10">
        <div className="text-center">
          <div className="flex justify-center">
            <RestaurantLogo size="md" />
          </div>
          <h1 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-bold text-orange-950 font-display">Create Account</h1>
        </div>

        <Card className="border-orange-100 shadow-xl shadow-orange-900/5 bg-white rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-xl sm:text-2xl flex items-center gap-2 text-orange-950">
              <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
              Sign Up
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black tracking-widest text-orange-900/40 ml-1">FULL NAME</Label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-300" />
                  <Input
                    type="text"
                    className="pl-11 h-12 rounded-xl border-orange-100 bg-orange-50/30 focus-visible:ring-orange-500 text-base font-medium"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. John Doe"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black tracking-widest text-orange-900/40 ml-1">EMAIL ADDRESS</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-300" />
                  <Input
                    type="email"
                    className="pl-11 h-12 rounded-xl border-orange-100 bg-orange-50/30 focus-visible:ring-orange-500 text-base font-medium"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@example.com"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black tracking-widest text-orange-900/40 ml-1">PASSWORD</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-300" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    className="pl-11 pr-11 h-12 rounded-xl border-orange-100 bg-orange-50/30 focus-visible:ring-orange-500 text-base font-medium"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-300 hover:text-orange-500 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button 
                className="w-full bg-orange-500 hover:bg-orange-600 h-12 sm:h-14 rounded-2xl text-lg sm:text-xl font-bold shadow-lg shadow-orange-500/20 mt-4 active:scale-[0.98] transition-all" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating...</span>
                  </div>
                ) : "Sign Up"}
              </Button>

              <div className="text-center mt-6">
                <p className="text-sm sm:text-base text-orange-800/60 font-medium">
                  Already have an account?{" "}
                  <Link to="/login" className="text-orange-600 font-bold hover:underline">
                    Log in
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;