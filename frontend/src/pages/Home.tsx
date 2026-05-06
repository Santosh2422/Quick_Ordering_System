import { 
  User, 
  Store, 
  ShieldAlert, 
  Mail, 
  LogOut, 
  Briefcase, 
  BadgeCheck 
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";

const Home = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isOwner = user?.role === "owner";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* --- Header --- */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-orange-600 p-2 rounded-lg shrink-0">
              <Store className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg md:text-xl font-bold text-gray-900 truncate">
              Restaurant POS
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleLogout}
              className="bg-orange-600 hover:bg-orange-700 text-white gap-2 h-9 md:h-10"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="container px-4 md:px-6 py-6 md:py-10 max-w-5xl">

        {/* Welcome Section */}
        <div className="mb-6 md:mb-8 text-left">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Welcome, {user?.name || "User"}! 👋
          </h1>

          <p className="text-sm md:text-base text-muted-foreground mt-2">
            Here is your account overview and current system status.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* --- Left Column: User Profile --- */}
          <Card className="shadow-sm border-gray-200 h-full">
            <CardHeader className="bg-gray-50/50 border-b pb-4">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <User className="w-5 h-5 text-blue-600" />
                Your Profile
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-6 space-y-4 text-left">

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0">
                <span className="text-sm font-medium text-gray-500 uppercase tracking-tight sm:normal-case">
                  Full Name
                </span>

                <span className="text-base font-semibold text-gray-900">
                  {user?.name}
                </span>
              </div>

              <Separator />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0">
                <span className="text-sm font-medium text-gray-500 uppercase tracking-tight sm:normal-case">
                  Email Address
                </span>

                <span className="text-base font-semibold text-gray-900 break-all">
                  {user?.email}
                </span>
              </div>

              <Separator />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                <span className="text-sm font-medium text-gray-500 uppercase tracking-tight sm:normal-case">
                  Current Role
                </span>

                <Badge
                  variant={isOwner ? "default" : "secondary"}
                  className="capitalize px-3 py-1 w-fit"
                >
                  {user?.role || "User"}
                </Badge>
              </div>

              {user?.restaurantId && (
                <>
                  <Separator />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0">
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-tight sm:normal-case">
                      Restaurant ID
                    </span>

                    <span className="font-mono text-[10px] md:text-xs bg-gray-100 px-2 py-1 rounded w-fit break-all">
                      {user.restaurantId}
                    </span>
                  </div>
                </>
              )}

            </CardContent>
          </Card>

          {/* --- Right Column --- */}
          <div className="flex flex-col gap-6 text-left">

            {/* If user is NOT owner */}
            {!isOwner && (
              <Card className="border-l-4 border-l-amber-500 shadow-md bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-700 text-lg md:text-xl">
                    <ShieldAlert className="w-6 h-6 shrink-0" />
                    Account Restriction
                  </CardTitle>

                  <CardDescription className="text-gray-600 pt-2 text-sm">
                    You currently have the{" "}
                    <strong>{user?.role || "User"}</strong> role.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">

                  <p className="text-sm text-gray-700 leading-relaxed">
                    To create a new restaurant, manage menu items, or view sales reports,
                    your account requires the <strong>Owner</strong> role.
                  </p>

                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 flex gap-3 items-start">
                    <Briefcase className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />

                    <div className="text-sm text-amber-800 space-y-3">

                      <div>
                        <strong>Action Required:</strong><br />
                        Please contact the system administrator to upgrade your role to
                        "Owner" to proceed with setting up your business.
                      </div>

                      {/* Highlighted Demo Section */}
                      <div className="bg-gradient-to-r from-orange-100 to-amber-100 border-2 border-orange-400 rounded-lg p-4 shadow-sm">

                        <p className="font-bold text-orange-900 text-sm mb-2">
                          🚀 Demo Access Available
                        </p>

                        <p className="text-orange-800 text-xs leading-relaxed mb-3">
                          If you are here to test the application, promote yourself to{" "}
                          <span className="font-bold">Owner</span> using the admin
                          credentials below:
                        </p>

                        <div className="bg-white rounded-md border border-orange-200 p-3 space-y-2">

                          <div>
                            <span className="font-semibold text-gray-700">
                              Email:
                            </span>

                            <div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded mt-1 break-all">
                              demo@example.com
                            </div>
                          </div>

                          <div>
                            <span className="font-semibold text-gray-700">
                              Password:
                            </span>

                            <div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded mt-1 break-all">
                              demo@123
                            </div>
                          </div>

                        </div>
                      </div>

                    </div>
                  </div>

                </CardContent>

                <CardFooter className="bg-gray-50 border-t pt-4">
                  <Button
                    className="w-full gap-2 h-11"
                    variant="outline"
                    onClick={() =>
                      (window.location.href = "mailto:admin@pos-system.com")
                    }
                  >
                    <Mail className="w-4 h-4" />
                    Contact Support / Admin
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* If user IS owner */}
            {isOwner && (
              <Card className="border-l-4 border-l-green-500 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700 text-lg md:text-xl">
                    <BadgeCheck className="w-6 h-6 shrink-0" />
                    Ready for Business
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <p className="text-gray-600 mb-4 text-sm md:text-base">
                    You have <strong>Owner</strong> privileges.
                    You can now manage your restaurant.
                  </p>

                  <div className="flex flex-col gap-2">

                    {user?.restaurantId ? (
                      <Link to="/admin/dashboard">
                        <Button className="w-full bg-green-600 hover:bg-green-700 h-11">
                          Go to Admin Dashboard
                        </Button>
                      </Link>
                    ) : (
                      <Link to="/onboarding/create-restaurant">
                        <Button className="w-full bg-green-600 hover:bg-green-700 h-11">
                          Create New Restaurant
                        </Button>
                      </Link>
                    )}

                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
