import { createContext, useContext, useState, useEffect } from "react";
import * as authApi from "../services/auth.service";

/* ================= TYPES ================= */

export interface User {
  id: string;
  name: string;
  email?: string;
  username?: string;
  role?: string;
  restaurantId?: string;
  mustChangePassword?: boolean;
}

interface LoginData {
  identifier: string; // email or username
  password: string;
  selectedRestaurantId: string;
}

interface SignupData {
  name: string;
  email: string;
  password: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginData) => Promise<any>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

/* ================= CONTEXT ================= */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ================= PROVIDER ================= */

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (data: LoginData) => {
      const res = await authApi.login(data);

      // 1. Check for explicit failure
      if (res.data.success === false) {
        throw new Error(res.data.message || "Login failed");
      }

      // 2. Handle multi-branch owner selection flow
      // FIX: Return the raw data so the component can see 'res.data.status'
      if (res.data.status === 'selection_required') {
        return res.data; 
      }

      // 3. Validate token presence
      if (!res.data.token) {
        console.error('Login response missing token:', res.data);
        throw new Error('Invalid server response: missing authentication token');
      }

      // 4. Validate user data presence
      if (!res.data.user) {
        console.error('Login response missing user data:', res.data);
        throw new Error('Invalid server response: missing user data');
      }

      // 5. Success State Updates
      localStorage.setItem("token", res.data.token);
      const userData = res.data.user;
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      // 6. FIX: Return the data on success too!
      return res.data;
  };



  const signup = async (data: SignupData) => {
    const res = await authApi.signup(data);

    if (res.data.success === false) {
      throw new Error(res.data.message || "Signup failed");
    }

    // Validate token presence
    if (!res.data.token) {
      console.error('Signup response missing token:', res.data);
      throw new Error('Invalid server response: missing authentication token');
    }

    // Validate user data presence
    if (!res.data.user) {
      console.error('Signup response missing user data:', res.data);
      throw new Error('Invalid server response: missing user data');
    }

    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));
    setUser(res.data.user);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error("Logout error", err);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    setUser((prev) => {
      const newUser = prev ? { ...prev, ...userData } : null;
      if (newUser) {
        localStorage.setItem("user", JSON.stringify(newUser));
      }
      return newUser;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

/* ================= HOOK ================= */

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
