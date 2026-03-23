import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FFFBF0]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // ❌ Not logged in → go to unified login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ❌ Role not allowed → go to landing page or unauthorized
  if (allowedRoles && user.role && !allowedRoles.includes(user.role)) {
    console.warn(`Access denied for role: ${user.role}. Allowed: ${allowedRoles.join(", ")}`);
    return <Navigate to="/" replace />;
  }

  // ✅ Logged in & Role allowed → allow access
  return children;
};

export default ProtectedRoute;
