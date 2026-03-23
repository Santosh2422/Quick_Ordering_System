import api from "./api";

export const startSessionApi = (restaurantId: string, tableNumber: string) =>
  api.post("/session/start", { restaurantId, tableNumber });

// Get details of the CURRENTLY active restaurant (based on token/user context)
export const getMyRestaurantApi = async () => {
  return await api.get("/rest/me");
};

// Update details
export const updateRestaurantApi = async (data: any) => {
  return await api.put("/rest/update", data);
};