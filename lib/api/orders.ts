export type OrderAmountColumns = {
  currency: string;
  subtotal_cents: number;
  shipping_cents: number;
  tax_cents: number;
  discount_cents: number;
  total_cents: number;
};

export function orderAmounts(row: OrderAmountColumns) {
  return {
    subtotalCents: row.subtotal_cents,
    shippingCents: row.shipping_cents,
    taxCents: row.tax_cents,
    discountCents: row.discount_cents,
    totalCents: row.total_cents,
    currency: row.currency,
  };
}
