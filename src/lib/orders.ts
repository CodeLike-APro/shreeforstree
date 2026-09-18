export function orderReference(orderId: string): string {
  const reference = orderId.slice(-8).toUpperCase();
  return `#${reference}`;
}

type FractionDigits = 0 | 2;

const amountFormatters: Record<FractionDigits, Intl.NumberFormat> = {
  0: new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }),

  2: new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }),
};

export function formatAmount(
  amount: string | number,
  { fractionalDigits = 2 }: { fractionalDigits?: FractionDigits } = {},
): string {
  return amountFormatters[fractionalDigits].format(Number(amount));
}

export function itemCount(count: number): string {
  return `${count} item${count !== 1 ? "s" : ""}`;
}

export function formatDate(date: Date | string | number): string {
  const options = { day: "numeric", month: "short", year: "numeric" } as const;
  return new Date(date).toLocaleDateString("en-IN", options);
}

export function handleCopyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}
