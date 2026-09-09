export function orderReference(orderId: string): string {
  const reference = orderId.slice(-8).toUpperCase();
  return `#${reference}`;
}

export function formatAmount(amount: string): string {
  const amountNumber = Number(amount);
  const formattedAmount = Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amountNumber);

  return formattedAmount;
}

export function itemCount(count: number): string {
  return `${count} item${count !== 1 ? "s" : ""}`;
}
