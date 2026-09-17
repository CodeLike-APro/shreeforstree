export type PaymentOrderReady = {
  razorpayOrderId: string;
  amount: string;
  currency: string;
  keyId: string;
  name: string;
  email: string;
  contact: string;
};

export type PaymentOrderSettled = {
  razorpayOrderId?: undefined;
  amount: string;
  currency: string;
};

export type PaymentOrderData = PaymentOrderReady | PaymentOrderSettled;

export type PaymentConfirmData = { orderId: string };
