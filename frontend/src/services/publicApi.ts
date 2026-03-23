import axios from "axios";
import axiosInstance from "@/lib/axios";


// Public API client - NO authentication, NO interceptors
// Use this for guest customer endpoints
const publicApi = axiosInstance.create({
    baseURL: `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5001"}/api`,
    withCredentials: false, // Don't send cookies
    headers: {
        "Content-Type": "application/json",
    },
});

export default publicApi;
