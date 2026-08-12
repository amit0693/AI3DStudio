const formatters = new Map<string, Intl.NumberFormat>();

function formatter(currency: string, minimumFractionDigits: number) {
  const key = `${currency}:${minimumFractionDigits}`;
  let existing = formatters.get(key);
  if (!existing) {
    existing = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits,
    });
    formatters.set(key, existing);
  }
  return existing;
}

export function formatCurrency(
  amount: number,
  { currency = "USD", minimumFractionDigits = 2 } = {},
) {
  return formatter(currency, minimumFractionDigits).format(amount);
}

export function formatCents(
  cents: number,
  options?: { currency?: string; minimumFractionDigits?: number },
) {
  return formatCurrency(cents / 100, options);
}

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
