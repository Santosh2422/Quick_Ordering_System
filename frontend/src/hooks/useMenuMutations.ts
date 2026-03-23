import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";

export const useAddMenuItem = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (item: { name: string; price: number }) =>
      api.post("/menu", item),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu"] }),
  });
};

export const useDeleteMenuItem = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      api.post(`/menu/${id}/delete`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu"] }),
  });
};
