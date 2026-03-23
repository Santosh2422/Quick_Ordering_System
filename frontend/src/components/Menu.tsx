import { useEffect, useState } from "react";
import { getMyMenu, addMenu } from "../services/menu.service";

/* ================= TYPES ================= */
interface MenuItem {
  id?: string;
  name: string;
  price: number;
}

const Menu = () => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ================= FETCH MENU ================= */
  const fetchMenu = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getMyMenu()
      // Ensure data is always an array
      setMenu(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || "Failed to load menu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  /* ================= ADD MENU ================= */
  const handleAddMenu = async () => {
    try {
      const newItem = {
        name: "Pizza",
        price: 250,
      };

      await addMenu(newItem);

      // ✅ SAFEST way: re-fetch menu
      await fetchMenu();
    } catch (err: any) {
      alert(err?.message || "Failed to add menu item");
    }
  };

  /* ================= UI ================= */
  if (loading) return <p>Loading menu...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <h2>My Menu</h2>

      {menu.length === 0 && <p>No menu items found</p>}

      {menu.map((item, index) => (
        <p key={item.id ?? index}>
          {item.name} – ₹{item.price}
        </p>
      ))}

      <button onClick={handleAddMenu}>Add Menu Item</button>
    </div>
  );
};

export default Menu;
