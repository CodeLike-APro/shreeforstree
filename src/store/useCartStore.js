// src/store/useCartStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useCartStore = create(
  persist(
    (set, get) => ({
      cart: [],

      updateQuantity: (id, size, newQty) => {
        set((state) => ({
          cart: state.cart.map((item) => {
            if (item.id === id && item.size === size) {
              const price = parseInt(item.currentPrice.replace(/\D/g, ""), 10);
              const updatedQty = Math.max(1, newQty);
              return {
                ...item,
                quantity: updatedQty,
                totalPrice: price * updatedQty,
              };
            }
            return item;
          }),
        }));
      },

      addToCart: (product, selectedSize) => {
        const existingCart = get().cart;
        const exists = existingCart.find(
          (item) => item.id === product.id && item.size === selectedSize
        );

        if (exists) {
          set({
            cart: existingCart.map((item) =>
              item.id === product.id && item.size === selectedSize
                ? {
                    ...item,
                    quantity: item.quantity + product.quantity,
                    totalPrice:
                      (item.quantity + product.quantity) *
                      parseInt(product.currentPrice.replace(/\D/g, ""), 10),
                  }
                : item
            ),
          });
        } else {
          const price = parseInt(product.currentPrice.replace(/\D/g, ""), 10);
          set({
            cart: [
              ...existingCart,
              {
                ...product,
                size: selectedSize,
                quantity: product.quantity,
                totalPrice: price * product.quantity,
              },
            ],
          });
        }
      },

      removeFromCart: (id, size) => {
        const updated = get().cart.filter(
          (item) => !(item.id === id && item.size === size)
        );
        set({ cart: updated });
      },

      clearCart: () => set({ cart: [] }),
    }),
    {
      name: "cart-storage", // localStorage key
      getStorage: () => localStorage, // persist across tabs/pages
    }
  )
);
