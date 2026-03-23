import { useEffect, useState } from "react";
import { getMyMenu } from "@/services/menu.service";

export const useMenu = () => {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyMenu()
      .then((res) => setMenu(res.data))
      .finally(() => setLoading(false));
  }, []);

  return { menu, loading };
};
