/**
 * @file ShopContext.jsx
 * @description Context API provider for active shop type metadata, theme, and shop configuration.
 */
import { createContext, useContext, useState, useEffect } from 'react';
import { SHOP_TYPES, getShopTypeById } from '@/data/shopTypesData';
import { useAuth } from '@/context/AuthContext';

export const ShopContext = createContext(null);

export function ShopProvider({ children }) {
  const { mongoShop } = useAuth();

  const [selectedShopId, setSelectedShopId] = useState(() => {
    return localStorage.getItem('shopo_selected_shop_id') || 'grocery';
  });

  const [activeShop, setActiveShop] = useState(() => {
    return getShopTypeById(selectedShopId);
  });

  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('shopo_theme') || 'light';
  });

  useEffect(() => {
    if (mongoShop?.business_type) {
      setSelectedShopId(mongoShop.business_type);
    }
  }, [mongoShop?.business_type]);

  useEffect(() => {
    const shop = getShopTypeById(selectedShopId);
    setActiveShop(shop);
    localStorage.setItem('shopo_selected_shop_id', selectedShopId);
  }, [selectedShopId]);

  useEffect(() => {
    localStorage.setItem('shopo_theme', theme);
    const root = document.documentElement;
    const body = document.body;
    if (theme === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
    }
  }, [theme]);

  const selectShopType = (id) => {
    setSelectedShopId(id);
  };

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (mode) => {
    setThemeState(mode);
  };

  return (
    <ShopContext.Provider
      value={{
        selectedShopId,
        activeShop,
        selectShopType,
        theme,
        toggleTheme,
        setTheme,
        allShopTypes: SHOP_TYPES
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
}
