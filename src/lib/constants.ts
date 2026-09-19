import type { OrderStatus } from "@/types/models";

export const SHIPPING_CHARGE = 60;

export const FREE_SHIPPING_THRESHOLD = 999.99;

export const MAX_CART_ITEMS = 10;

export const VALID_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  not_placed: ["placed"],
  placed: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
};

export const MAX_HERO_PRODUCTS = 4;

export const MAX_ATELIER_EDIT_PRODUCTS = 4;

export const MAX_NEW_ARRIVALS = 12;

export const MAX_CATEGORIES = 7;

export const HERO_SLIDE_INTERVAL_MS = 5500;
