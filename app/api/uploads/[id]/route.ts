import { getD1 } from "@/db";
import {
  ApiError,
  handleApiError,
  json,
  parseJsonColumn,
  readPathParam,
  sha256Hex,
} from "@/lib/api";

type UploadStatusRow = {
  id: string;
  access_token_hash: string;
  original_filename: string;
  format: string;
  byte_size: number;
  status: string;
  client_estimates_json: string;
  rejection_reason: string | null;
  expires_at: string | null;
  created_at: string;
  quote_id: string | null;
  quote_status: string | null;
  material: string | null;
  color: string | null;
  quality: string | null;
  infill_percent: number | null;
  quantity: number | null;
  quoted_price_cents: number | null;
  currency: string | null;
  quote_expires_at: string | null;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const id = await readPathParam(params, "id", {
      pattern: /^upl_[a-f0-9-]{36}$/,
      message: "Upload not found.",
      status: 404,
    });
    const accessToken = request.headers.get("x-upload-token")?.trim() ?? "";
    if (!/^[a-f0-9]{64}$/.test(accessToken)) {
      throw new ApiError(404, "Upload not found.");
    }

    const row = await getD1()
      .prepare(
        `SELECT u.id, u.access_token_hash, u.original_filename, u.format,
                u.byte_size, u.status, u.client_estimates_json,
                u.rejection_reason, u.expires_at, u.created_at,
                q.id AS quote_id, q.status AS quote_status, q.material, q.color,
                q.quality, q.infill_percent, q.quantity, q.quoted_price_cents,
                q.currency, q.expires_at AS quote_expires_at
         FROM uploads u
         LEFT JOIN quotes q ON q.upload_id = u.id
         WHERE u.id = ?
         ORDER BY q.created_at DESC
         LIMIT 1`,
      )
      .bind(id)
      .first<UploadStatusRow>();
    if (!row || (await sha256Hex(accessToken)) !== row.access_token_hash) {
      throw new ApiError(404, "Upload not found.");
    }

    return json({
      upload: {
        id: row.id,
        filename: row.original_filename,
        format: row.format,
        byteSize: row.byte_size,
        status: row.status,
        clientEstimates: parseJsonColumn<Record<string, number>>(
          row.client_estimates_json,
          {},
        ),
        rejectionReason: row.rejection_reason,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
      },
      quote: row.quote_id
        ? {
            id: row.quote_id,
            status: row.quote_status,
            material: row.material,
            color: row.color,
            quality: row.quality,
            infillPercent: row.infill_percent,
            quantity: row.quantity,
            quotedPriceCents: row.quoted_price_cents,
            currency: row.currency,
            expiresAt: row.quote_expires_at,
          }
        : null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
