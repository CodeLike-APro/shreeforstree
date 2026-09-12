export function orderReference(orderId: string): string {
  const reference = orderId.slice(-8).toUpperCase();
  return `#${reference}`;
}

export function formatAmount(amount: string | number): string {
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

export function formatDate(date: Date): string {
  const options = { day: "numeric", month: "short", year: "numeric" } as const;
  return date.toLocaleDateString("en-IN", options);
}

export function handleCopyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}
