import { createContext, useContext, useState } from "react";

export type MenuItem = {
  id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  isVeg: boolean;
};

type MenuContextType = {
  menu: MenuItem[];
  addMenuItem: (item: MenuItem) => void;
};

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const MenuProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [menu, setMenu] = useState<MenuItem[]>([]);

  const addMenuItem = (item: MenuItem) => {
    setMenu((prev) => [...prev, item]);
  };

  return (
    <MenuContext.Provider value={{ menu, addMenuItem }}>
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = () => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error("useMenu must be used within MenuProvider");
  }
  return context;
};
