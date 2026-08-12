import { parseJsonColumn } from "./fields";

export const PRODUCT_COLUMNS = `id, slug, sku, name, short_description, description, category,
         product_type, base_price_cents, compare_at_price_cents, currency,
         material, image_url, gallery_json, personalization_schema_json,
         attributes_json, lead_time_min_days, lead_time_max_days, minimum_quantity,
         is_featured`;

export type ProductRow = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  short_description: string;
  description: string;
  category: string;
  product_type: string;
  base_price_cents: number;
  compare_at_price_cents: number | null;
  currency: string;
  material: string;
  image_url: string | null;
  gallery_json: string;
  personalization_schema_json: string;
  attributes_json: string;
  lead_time_min_days: number;
  lead_time_max_days: number;
  minimum_quantity: number;
  is_featured: number;
};

export function publicProduct(row: ProductRow) {
  return {
    id: row.id,
    slug: row.slug,
    sku: row.sku,
    name: row.name,
    shortDescription: row.short_description,
    description: row.description,
    category: row.category,
    productType: row.product_type,
    price: {
      amountCents: row.base_price_cents,
      compareAtAmountCents: row.compare_at_price_cents,
      currency: row.currency,
    },
    material: row.material,
    imageUrl: row.image_url,
    gallery: parseJsonColumn<unknown[]>(row.gallery_json, []),
    personalization: parseJsonColumn<unknown[]>(
      row.personalization_schema_json,
      [],
    ),
    attributes: parseJsonColumn<Record<string, unknown>>(
      row.attributes_json,
      {},
    ),
    leadTimeDays: {
      min: row.lead_time_min_days,
      max: row.lead_time_max_days,
    },
    minimumQuantity: row.minimum_quantity,
    featured: Boolean(row.is_featured),
  };
}
