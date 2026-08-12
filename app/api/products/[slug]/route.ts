import { getD1 } from "@/db";
import {
  ApiError,
  handleApiError,
  json,
  ProductRow,
  publicProduct,
} from "../_shared";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug: rawSlug } = await params;
    const slug = decodeURIComponent(rawSlug).toLowerCase();
    if (!/^[a-z0-9-]{1,80}$/.test(slug)) {
      throw new ApiError(400, "Product slug is invalid.");
    }

    const row = await getD1()
      .prepare(
        `SELECT id, slug, sku, name, short_description, description, category,
                product_type, base_price_cents, compare_at_price_cents, currency,
                material, image_url, gallery_json, personalization_schema_json,
                attributes_json, lead_time_min_days, lead_time_max_days,
                minimum_quantity, is_featured
         FROM products
         WHERE slug = ? AND is_active = 1
         LIMIT 1`,
      )
      .bind(slug)
      .first<ProductRow>();

    if (!row) throw new ApiError(404, "Product not found.");
    return json(publicProduct(row), 200, {
      "Cache-Control": "public, max-age=60, s-maxage=300",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
