import { getD1 } from "@/db";
import {
  ApiError,
  CACHEABLE_HEADERS,
  handleApiError,
  json,
  PRODUCT_COLUMNS,
  ProductRow,
  publicProduct,
} from "@/lib/api";

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
      `SELECT ${PRODUCT_COLUMNS}
       FROM products
       WHERE ${conditions.join(" AND ")}
       ORDER BY is_featured DESC, sort_order ASC, name ASC LIMIT ?`,
    );
    const result = await statement.bind(...values).all<ProductRow>();

    return json(
      { products: result.results.map(publicProduct) },
      200,
      CACHEABLE_HEADERS,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
