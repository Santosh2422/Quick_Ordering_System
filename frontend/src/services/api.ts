import axios from "axios";
import axiosInstance from "@/lib/axios";

const api = axiosInstance.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5001"}/api`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const publicRoutes = ['/qr', '/rest/all', '/session/start', '/menu/public', '/orders/create', '/orders/session'];
  const isPublicRoute = publicRoutes.some(route => config.url?.includes(route));

  if (!isPublicRoute) {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  async (response) => {
    const { data, config } = response;

    // Handle Auth Errors sent via 200 OK
    if (data && data.success === false && data.isAuthError) {
      const publicRoutes = ['/qr', '/rest/all', '/session/start', '/menu/public', '/orders/create', '/orders/session'];
      const isPublicRoute = publicRoutes.some(route => config.url?.includes(route));

      if (!isPublicRoute && !(config as any)._retry) {
        (config as any)._retry = true;
        try {
          // 1. EXTRACT CURRENT RESTAURANT ID TO PRESERVE BRANCH
          const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
          const currentRestaurantId = storedUser.restaurantId;

          console.log("🔄 Auth error (200), refreshing for branch:", currentRestaurantId);

          // 2. PASS RESTAURANT ID IN THE BODY
          const res = await axiosInstance.post(
            `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5001"}/api/refresh/token`, 
            { restaurantId: currentRestaurantId }, 
            { withCredentials: true }
          );

          if (res.data.success) {
            const { token } = res.data;
            localStorage.setItem("token", token);
            api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            config.headers.Authorization = `Bearer ${token}`;
            return api(config);
          } else {
            throw new Error("Refresh failed");
          }
        } catch (err) {
          console.error("❌ Token refresh failed:", err);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
          return Promise.reject(err);
        }
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle standard 401 Unauthorized errors
    if (error.response?.status === 401 && !(originalRequest as any)._retry) {
      (originalRequest as any)._retry = true;
      try {
        // 1. EXTRACT CURRENT RESTAURANT ID
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const currentRestaurantId = storedUser.restaurantId;

        console.log("🔄 401 Error, refreshing for branch:", currentRestaurantId);

        // 2. PASS RESTAURANT ID IN THE BODY
        const res = await axiosInstance.post(
          `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5001"}/api/refresh/token`, 
          { restaurantId: currentRestaurantId }, 
          { withCredentials: true }
        );

        const { token } = res.data;
        localStorage.setItem("token", token);
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        
        if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        
        return api(originalRequest);
      } catch (err) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default api;