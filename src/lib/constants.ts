export const SHIPPING_CHARGE = 60;

export const FREE_SHIPPING_THRESHOLD = 999.99;

export const MAX_CART_ITEMS = 10;

export const VALID_ORDER_TRANSITIONS: Record<string, string[]> = {
  not_placed: ["placed"],
  placed: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
};
