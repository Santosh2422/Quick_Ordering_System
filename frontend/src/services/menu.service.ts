import api from "./api";

/* OWNER MENU */
export const getMyMenu = () =>
  api.get("/menu/my-menu");

/* PUBLIC MENU */
export const getPublicMenu = (
  restaurantId: string,
  tableSecretId: string
) =>
  api.get(`/menu/public/${restaurantId}?table=${tableSecretId}`);

/* ADD MENU */
export const addMenu = (data: any) =>
 api.post("/menu/", data);

/* UPDATE MENU ITEM */
export const updateMenuItemApi = (data: any) =>
  api.post("/menu/update-item", data);

/* DELETE MENU ITEM */
export const deleteMenuItemApi = (data: any) =>
  api.delete("/menu/delete-item", { data });

export const deleteCategoryApi = (categoryId: string) =>
  api.delete("/menu/delete-category", { data: { categoryId } });