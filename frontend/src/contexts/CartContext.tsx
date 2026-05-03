'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import type { MenuItem, Restaurant, CartLine } from '@/lib/types';

interface CartCtx {
  restaurant: Restaurant | null;
  lines: CartLine[];
  addItem: (item: MenuItem, restaurant: Restaurant, quantity?: number) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clear: () => void;
  subtotalCents: number;
  itemCount: number;
}

const Ctx = createContext<CartCtx | null>(null);
const STORAGE_KEY = 'tif_cart_v1';

export function CartProvider({ children }: { children: ReactNode }) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [lines, setLines] = useState<CartLine[]>([]);

  // Restore depuis localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setRestaurant(parsed.restaurant || null);
        setLines(parsed.lines || []);
      }
    } catch { /* ignore */ }
  }, []);

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ restaurant, lines }));
    } catch { /* ignore */ }
  }, [restaurant, lines]);

  function addItem(item: MenuItem, rest: Restaurant, quantity = 1) {
    // Règle métier : un panier = un restaurant. Reset si on change.
    if (restaurant && restaurant.id !== rest.id) {
      const ok = typeof window !== 'undefined'
        ? window.confirm('Votre panier contient des plats d\'un autre restaurant. Vider le panier ?')
        : true;
      if (!ok) return;
      setLines([{ menuItem: item, quantity }]);
      setRestaurant(rest);
      return;
    }
    setRestaurant(rest);
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.menuItem.id === item.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
        return next;
      }
      return [...prev, { menuItem: item, quantity }];
    });
  }

  function removeItem(menuItemId: string) {
    setLines((prev) => {
      const next = prev.filter((l) => l.menuItem.id !== menuItemId);
      if (next.length === 0) setRestaurant(null);
      return next;
    });
  }

  function updateQuantity(menuItemId: string, quantity: number) {
    if (quantity <= 0) return removeItem(menuItemId);
    setLines((prev) => prev.map((l) => l.menuItem.id === menuItemId ? { ...l, quantity } : l));
  }

  function clear() {
    setLines([]);
    setRestaurant(null);
  }

  const subtotalCents = useMemo(
    () => lines.reduce((sum, l) => sum + l.menuItem.priceCents * l.quantity, 0),
    [lines]
  );
  const itemCount = useMemo(
    () => lines.reduce((sum, l) => sum + l.quantity, 0),
    [lines]
  );

  return (
    <Ctx.Provider value={{ restaurant, lines, addItem, removeItem, updateQuantity, clear, subtotalCents, itemCount }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCart must be inside <CartProvider>');
  return ctx;
}
