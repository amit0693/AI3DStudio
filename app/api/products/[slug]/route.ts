import { getD1 } from "@/db";
import {
  ApiError,
  CACHEABLE_HEADERS,
  handleApiError,
  json,
  PRODUCT_COLUMNS,
  ProductRow,
  publicProduct,
  readPathParam,
} from "@/lib/api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const slug = await readPathParam(params, "slug", {
      pattern: /^[a-z0-9-]{1,80}$/,
      message: "Product slug is invalid.",
      lowercase: true,
    });

    const row = await getD1()
      .prepare(
        `SELECT ${PRODUCT_COLUMNS}
         FROM products
         WHERE slug = ? AND is_active = 1
         LIMIT 1`,
      )
      .bind(slug)
      .first<ProductRow>();

    if (!row) throw new ApiError(404, "Product not found.");
    return json(publicProduct(row), 200, CACHEABLE_HEADERS);
  } catch (error) {
    return handleApiError(error);
  }
}
