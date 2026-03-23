import api from "./api";

export const addUserApi = (data: any) => {
    return api.post("/admin/add-user", data);
};

export const getAllUsersApi = () => {
    return api.get("/admin/users");
};

export const deleteUserApi = (id: string) => {
    return api.delete(`/admin/user/${id}`);
};

export const getRestaurantsApi = () => {
    return api.get("/rest/all");
};
export const createRestaurantApi = (data: any) => {
    return api.post("/rest/create", data);
};

export const updateRole = (data: any) => {
    return api.patch("/admin/update-role", data);
}
