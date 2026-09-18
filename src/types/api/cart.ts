import type { CartItem } from "../models";

export type CartLineProduct = {
  title: string;
  price: string;
  discountedPrice: string | null;
  imageUrl: string | null;
  isActive: boolean;
};

export type CartLine = CartItem & { product: CartLineProduct };

export type CartSummary = {
  cartId: string;
  items: CartLine[];
  originalPriceTotal: string;
  discountedPriceTotal: string;
  discountAmount: string;
  shippingCharge: string;
  amountToFreeShipping: string;
  total: string;
};

export type CartMergeData = { merged: boolean; userCartId?: string };

export type CartClearData = { clearedCart: CartItem[] };
