import axios, { 
  AxiosInstance, 
  AxiosError, 
  InternalAxiosRequestConfig, 
  AxiosResponse 
} from "axios";

// 1. Extend Axios config to support our custom '_retry' flag
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// 2. Create the Axios Instance
const axiosInstance: AxiosInstance = axios.create({
  // Automatically switches between localhost and production URL
  baseURL: import.meta.env.MODE === "development" ? "http://localhost:5001/api" : "/api",
  withCredentials: true, // CRITICAL: Sends the HttpOnly Refresh Cookie
  headers: {
    "Content-Type": "application/json",
  },
});

// 3. Request Interceptor: Attach Access Token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 4. Response Interceptor: Handle Token Refresh & Branch Preservation
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig | undefined;

    // Safety check if config is missing
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // IF 401 Unauthorized AND we haven't retried this specific request yet...
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark as retried to prevent infinite loops

      try {
        // A. Get currently selected branch from Local Storage
        // We need this so the backend knows which branch session to keep alive
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const currentRestaurantId = storedUser.restaurantId;

        // B. Hit the Refresh Route
        // We pass the restaurantId in the body
        const { data } = await axios.post("/refresh/token", {
            restaurantId: currentRestaurantId 
        });

        if (data.success && data.token) {
           // C. Save the new Access Token
           localStorage.setItem("token", data.token);

           // D. Update the header of the failed request with the new token
           originalRequest.headers.Authorization = `Bearer ${data.token}`;
           
           // E. Retry the original failed request
           return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // F. If Refresh Fails (e.g. Refresh Token expired after 7 days), Logout
        console.error("Session completely expired. Logging out.");
        
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        
        // Force redirect to login page
        window.location.href = "/login";
        
        return Promise.reject(refreshError);
      }
    }

    // Return any other errors (403, 404, 500, etc.)
    return Promise.reject(error);
  }
);

export default axiosInstance;