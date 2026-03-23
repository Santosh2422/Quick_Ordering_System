import api from "./api";

export const getStaffApi = () =>
    api.get("/staff");

export const addStaffApi = (data: any) =>
    api.post("/staff", data);

export const approveStaffApi = (staffId: string) =>
    api.patch(`/staff/approve/${staffId}`);

export const deleteStaffApi = (staffId: string) =>
    api.delete(`/staff/${staffId}`);

export const updateStaffApi = async (staffId: string, data: any) => {
  return await api.put(`/staff/update/${staffId}`, data); 
};
