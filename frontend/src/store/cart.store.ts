import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  product_id: string;
  slug: string;
  name: string;
  price: number;
  stock: number;
  photo: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity: number) => void;
  updateQuantity: (product_id: string, quantity: number) => void;
  removeItem: (product_id: string) => void;
  clear: () => void;
  total: () => number;
  totalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item, quantity) => {
        set((state) => {
          const existing = state.items.find((i) => i.product_id === item.product_id);
          if (existing) {
            // Suma pero respeta el máximo de stock
            const newQty = Math.min(existing.quantity + quantity, item.stock);
            return {
              items: state.items.map((i) =>
                i.product_id === item.product_id ? { ...i, quantity: newQty } : i,
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity }] };
        });
      },

      updateQuantity: (product_id, quantity) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.product_id === product_id
              ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock)) }
              : i,
          ),
        }));
      },

      removeItem: (product_id) => {
        set((state) => ({ items: state.items.filter((i) => i.product_id !== product_id) }));
      },

      clear: () => set({ items: [] }),

      total: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      totalItems: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'ecommfast-cart' },
  ),
);
