export function formatMoney(amount: number, currency = "EUR") {
  try {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
