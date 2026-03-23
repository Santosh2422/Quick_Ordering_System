import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, LogIn, User, Store, ArrowLeft, CheckCircle2, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Form State
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Multi-Branch State
  const [step, setStep] = useState<"credentials" | "branch_selection">("credentials");
  const [branches, setBranches] = useState<any[]>([]);

  // Helper to handle navigation based on role
  const handleNavigation = (role: string) => {
    switch (role) {
      case "admin": navigate("/admin"); break;
      case "owner": navigate("/owner"); break;
      case "cashier": navigate("/cashier"); break;
      case "kitchen": navigate("/kitchen"); break;
      default: navigate("/");
    }
  };

  const handleLogin = async (e: React.FormEvent, selectedRestaurantId?: string) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result: any = await login({ 
        identifier, 
        password,
        selectedRestaurantId 
      });

      if (result?.status === 'selection_required' && result.restaurants?.length > 0) {
        setBranches(result.restaurants);
        setStep("branch_selection");
        toast.info("Please select a branch to continue");
        setIsLoading(false);
        return;
      }

      const role = result.user?.role || "staff";
      
      if (role === 'owner' && !result.user.restaurantId) {
        toast.success("Welcome! Let's set up your restaurant.");
      } else {
        toast.success(selectedRestaurantId ? `Logged in to branch!` : "Welcome back!");
      }

      handleNavigation(role);
    } catch (error: any) {
      toast.error(error.message || "Login failed");
      if (step === 'credentials') setPassword(""); 
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF0] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-[60%] sm:w-[40%] h-[40%] bg-orange-100 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] sm:w-[30%] h-[30%] bg-orange-50 rounded-full blur-3xl opacity-50" />

      <div className="w-full max-w-md space-y-6 sm:space-y-8 z-10">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-orange-500 text-white mb-3 sm:mb-4 shadow-lg shadow-orange-500/30">
            <Store className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-orange-950">
            {step === "credentials" ? "Welcome Back" : "Select Branch"}
          </h1>
          <p className="text-sm text-orange-800/60 mt-1 sm:mt-2">
            {step === "credentials" ? "Access your dashboard to manage your kitchen" : "Choose which location you want to manage"}
          </p>
        </div>

        <Card className="border-orange-100 shadow-2xl shadow-orange-900/10 bg-white rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden relative">
          
          {/* STEP 1: CREDENTIALS FORM */}
          {step === "credentials" && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-300">
              <CardHeader className="space-y-1 pb-2">
                <CardTitle className="text-xl sm:text-2xl flex items-center gap-2 text-orange-950">
                  <LogIn className="w-5 h-5 text-orange-500" />
                  Sign In
                </CardTitle>
              </CardHeader>

              <CardContent>
                <form onSubmit={(e) => handleLogin(e)} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black tracking-widest text-orange-900/40 ml-1 uppercase">Identifier</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-300" />
                      <Input
                        className="pl-11 h-12 rounded-xl border-orange-100 bg-orange-50/30 focus-visible:ring-orange-500 text-base font-medium transition-all"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="Username or Email"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black tracking-widest text-orange-900/40 ml-1 uppercase">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-300" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        className="pl-11 pr-11 h-12 rounded-xl border-orange-100 bg-orange-50/30 focus-visible:ring-orange-500 text-base font-medium transition-all"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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

                  <Button className="w-full bg-orange-500 hover:bg-orange-600 h-12 sm:h-14 rounded-2xl text-lg sm:text-xl font-bold shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all" disabled={isLoading}>
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Verifying...</span>
                      </div>
                    ) : "Sign In"}
                  </Button>

                  <div className="text-center mt-6">
                    <p className="text-sm text-orange-800/60">
                      Don't have an account?{" "}
                      <Link to="/signup" className="text-orange-600 font-bold hover:underline">
                        Create one
                      </Link>
                    </p>
                  </div>
                </form>
              </CardContent>
            </div>
          )}

          {/* STEP 2: BRANCH SELECTION */}
          {step === "branch_selection" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="p-5 sm:p-6 pb-2">
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   onClick={() => setStep("credentials")}
                   className="text-orange-400 hover:text-orange-600 -ml-2 mb-2 h-8 px-2"
                 >
                   <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
                 </Button>
                 <CardTitle className="text-lg sm:text-xl flex items-center gap-2 text-orange-950">
                    <Store className="w-5 h-5 text-orange-500" />
                    Select Active Branch
                 </CardTitle>
               </div>

               <div className="px-5 sm:px-6 pb-6 space-y-3 max-h-[60vh] sm:max-h-[400px] overflow-y-auto custom-scrollbar">
                 {branches.map((branch) => (
                   <button
                     key={branch.uid}
                     disabled={isLoading}
                     onClick={(e) => handleLogin(e, branch.uid)}
                     className="w-full text-left p-4 rounded-xl border border-orange-100 bg-orange-50/30 hover:bg-orange-100 hover:border-orange-300 transition-all group relative overflow-hidden active:scale-[0.98]"
                   >
                     <div className="flex items-center justify-between relative z-10">
                       <div className="min-w-0 pr-4">
                         <h3 className="font-bold text-orange-950 group-hover:text-orange-800 truncate">{branch.name}</h3>
                         <p className="text-[10px] text-orange-400 font-medium uppercase tracking-wider mt-0.5">ID: {branch.uid.slice(0, 8)}...</p>
                       </div>
                       <div className="w-8 h-8 flex-shrink-0 rounded-full bg-white flex items-center justify-center text-orange-300 group-hover:text-orange-600 group-hover:scale-110 transition-all shadow-sm">
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                       </div>
                     </div>
                   </button>
                 ))}
               </div>
            </div>
          )}

        </Card>
      </div>
    </div>
  );
};

export default Login;