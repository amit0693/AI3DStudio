import { getD1 } from "@/db";
import {
  ApiError,
  handleApiError,
  json,
  ProductRow,
  publicProduct,
} from "./_shared";

const PRODUCT_SELECT = `
  SELECT id, slug, sku, name, short_description, description, category,
         product_type, base_price_cents, compare_at_price_cents, currency,
         material, image_url, gallery_json, personalization_schema_json,
         attributes_json, lead_time_min_days, lead_time_max_days, is_featured
  FROM products
`;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get("category")?.trim().toLowerCase();
    const featured = url.searchParams.get("featured");
    const requestedLimit = Number(url.searchParams.get("limit") ?? "24");
    if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > 100) {
      throw new ApiError(400, "limit must be a whole number from 1 to 100.");
    }
    if (category && !/^[a-z0-9-]{1,48}$/.test(category)) {
      throw new ApiError(400, "category is invalid.");
    }
    if (featured != null && featured !== "true" && featured !== "false") {
      throw new ApiError(400, "featured must be true or false.");
    }

    const conditions = ["is_active = 1"];
    const values: Array<string | number> = [];
    if (category) {
      conditions.push("category = ?");
      values.push(category);
    }
    if (featured != null) {
      conditions.push("is_featured = ?");
      values.push(featured === "true" ? 1 : 0);
    }
    values.push(requestedLimit);

    const statement = getD1().prepare(
      `${PRODUCT_SELECT} WHERE ${conditions.join(" AND ")}
       ORDER BY is_featured DESC, sort_order ASC, name ASC LIMIT ?`,
    );
    const result = await statement.bind(...values).all<ProductRow>();

    return json(
      { products: result.results.map(publicProduct) },
      200,
      { "Cache-Control": "public, max-age=60, s-maxage=300" },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
