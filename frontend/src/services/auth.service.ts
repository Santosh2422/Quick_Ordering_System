import api from "./api";

/* LOGIN */
export const login = (data: {
  identifier: string;
  password: string;
  selectedRestaurantId?: string;
}) => {
  return api.post("/auth/login", data);
};

/* SIGNUP */
export const signup = (data: {
  name: string;
  email: string;
  password: string;
  role?: string;
  username?: string;
}) => {
  return api.post("/auth/signup", data);
};

/* LOGOUT */
export const logout = () => {
  return api.post("/auth/logout");
};

export const updateProfile = async (data: {
  email?: string;
  username?: string;
  role?: string;
  restaurantId?: string;
}) => {
  return api.patch("/auth/profile", data);
}

export const changePasswordApi = (data: { currentPassword: string; newPassword: string }) => {
  return api.put("/auth/change-password", data);
};