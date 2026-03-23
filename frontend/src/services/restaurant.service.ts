import api from "./api";

export const createRestaurant = (
  data: any,
  options?: { mode?: "dashboard" | "onboarding" }
) => {
  const mode = options?.mode;

  return api.post(
    mode ? `/rest/create?mode=${mode}` : "/rest/create",
    data
  );
};


export const updateRestaurant = (data: any) =>
  api.put("/rest/update", data);

export const getAllRestaurants = () => api.get("/rest/all");


export const getMyRestaurantApi = async () => {
  return await api.get("/rest/me");
};

// Update details
export const updateRestaurantApi = async (data: any) => {
  console.log("🚀 Sending to Backend:", data); // Debug Log
  return await api.put("/rest/update", data);
};

export const getRestaurantById = async () => {
  return await api.get("/rest/me")
}