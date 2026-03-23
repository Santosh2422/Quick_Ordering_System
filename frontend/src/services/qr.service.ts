import api from "./api";
import publicApi from "./publicApi";

/**
 * Generate QR code for a table (PROTECTED - Owner only)
 */
export const generateTableQrApi = (data: {
  tableName: string;
}) => {
  return api.post("/qr/genQR", data);
};

/**
 * Fetch tables for a restaurant (PUBLIC - No auth required)
 */
export const fetchTablesApi = (restaurantId: string) => {
  return publicApi.get(`/qr?restaurantId=${restaurantId}`);
};

/**
 * Fetch tables for Owner (PROTECTED)
 */
export const fetchOwnerTablesApi = () => {
  return api.get("/qr/my-tables");
};

/**
 * Delete a table (PROTECTED - Owner only)
 */
export const deleteTableApi = (tableId: string) => {
  return api.delete(`/qr/${tableId}`);
};
