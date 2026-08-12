import { getD1, getUploadsBucket } from "@/db";
import {
  ApiError,
  assertContentLengthWithin,
  cleanEmail,
  cleanText,
  handleApiError,
  integerInRange,
  isMultipartFormData,
  json,
  oneOf,
  prefixedId,
  randomToken,
  readFormFile,
  readFormText,
  sha256Hex,
} from "@/lib/api";

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_MULTIPART_BYTES = MAX_FILE_BYTES + 256 * 1024;
const ALLOWED_QUALITY = new Set(["draft", "standard", "fine"]);
const ALLOWED_MATERIAL = new Set(["PLA", "PETG", "TPU"]);

const MIME_TYPES: Record<string, Set<string>> = {
  stl: new Set([
    "application/octet-stream",
    "application/sla",
    "application/vnd.ms-pki.stl",
    "model/stl",
  ]),
  obj: new Set(["application/octet-stream", "model/obj", "text/plain"]),
  "3mf": new Set([
    "application/octet-stream",
    "application/zip",
    "application/vnd.ms-package.3dmanufacturing-3dmodel+xml",
    "model/3mf",
  ]),
};

function safeFilename(value: string) {
  const leaf = value.split(/[\\/]/).pop() ?? "model";
  const cleaned = leaf.replace(/[^a-zA-Z0-9 ._()-]/g, "_").trim();
  return (cleaned || "model").slice(0, 180);
}

function inspectFile(bytes: ArrayBuffer, format: string) {
  const view = new Uint8Array(bytes);
  if (format === "3mf") {
    if (view.length < 4 || view[0] !== 0x50 || view[1] !== 0x4b) {
      throw new ApiError(400, "The 3MF file is not a valid ZIP-based model package.");
    }
    return;
  }
  if (format === "obj") {
    const preview = new TextDecoder().decode(view.slice(0, 8192));
    if (!/^(?:v|o|g|f)\s+/m.test(preview)) {
      throw new ApiError(400, "The OBJ file does not contain recognizable model data.");
    }
    return;
  }
  if (view.length < 84) {
    throw new ApiError(400, "The STL file is too small to contain a printable mesh.");
  }
}

function optionalClientEstimates(form: FormData) {
  const result: Record<string, number> = {};
  for (const [formKey, outputKey] of [
    ["widthMm", "widthMm"],
    ["heightMm", "heightMm"],
    ["depthMm", "depthMm"],
    ["volumeMm3", "volumeMm3"],
  ] as const) {
    const raw = readFormText(form, formKey);
    if (raw == null || raw === "") continue;
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0 || value > 10_000_000_000) {
      throw new ApiError(400, `${formKey} is invalid.`);
    }
    result[outputKey] = value;
  }
  return result;
}

export async function POST(request: Request) {
  let uploadedObjectKey: string | null = null;
  try {
    if (!isMultipartFormData(request)) {
      throw new ApiError(415, "Use multipart/form-data with a file field.");
    }
    assertContentLengthWithin(
      request,
      MAX_MULTIPART_BYTES,
      "The upload exceeds the 25 MB limit.",
    );

    const form = await request.formData();
    const candidate = readFormFile(form, "file");
    if (!candidate) {
      throw new ApiError(400, "A model file is required in the file field.");
    }
    if (candidate.size < 1 || candidate.size > MAX_FILE_BYTES) {
      throw new ApiError(413, "Model files must be between 1 byte and 25 MB.");
    }

    const originalFilename = safeFilename(candidate.name);
    const format = originalFilename.split(".").pop()?.toLowerCase() ?? "";
    if (!(format in MIME_TYPES)) {
      throw new ApiError(400, "Upload an STL, OBJ, or 3MF model.");
    }
    const normalizedMime = (candidate.type || "application/octet-stream").toLowerCase();
    if (!MIME_TYPES[format].has(normalizedMime)) {
      throw new ApiError(415, `The file type does not match a ${format.toUpperCase()} model.`);
    }

    const email = cleanEmail(readFormText(form, "email"), false);
    const material = (cleanText(readFormText(form, "material"), "material", 12) ?? "PLA").toUpperCase();
    const color = cleanText(readFormText(form, "color"), "color", 40);
    const quality = (cleanText(readFormText(form, "quality"), "quality", 16) ?? "standard").toLowerCase();
    oneOf(material, ALLOWED_MATERIAL, "material must be PLA, PETG, or TPU.");
    oneOf(quality, ALLOWED_QUALITY, "quality must be draft, standard, or fine.");
    const infillPercent = integerInRange(
      Number(readFormText(form, "infillPercent") ?? "20"),
      "infillPercent",
      0,
      100,
      20,
    );
    const quantity = integerInRange(
      Number(readFormText(form, "quantity") ?? "1"),
      "quantity",
      1,
      100,
      1,
    );
    const clientEstimates = optionalClientEstimates(form);

    const bytes = await candidate.arrayBuffer();
    inspectFile(bytes, format);
    const uploadId = prefixedId("upl");
    const quoteId = prefixedId("qte");
    const accessToken = randomToken();
    const accessTokenHash = await sha256Hex(accessToken);
    const checksum = await sha256Hex(bytes);
    const now = new Date();
    const objectKey = `models/${now.getUTCFullYear()}/${String(
      now.getUTCMonth() + 1,
    ).padStart(2, "0")}/${uploadId}.${format}`;
    uploadedObjectKey = objectKey;
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await getUploadsBucket().put(objectKey, bytes, {
      httpMetadata: { contentType: normalizedMime },
      customMetadata: {
        uploadId,
        format,
        sha256: checksum,
      },
    });

    const db = getD1();
    await db.batch([
      db
        .prepare(
          `INSERT INTO uploads (
             id, object_key, access_token_hash, original_filename, format,
             content_type, byte_size, sha256, status, customer_email,
             client_estimates_json, expires_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'received', ?, ?, ?)`,
        )
        .bind(
          uploadId,
          objectKey,
          accessTokenHash,
          originalFilename,
          format,
          normalizedMime,
          candidate.size,
          checksum,
          email,
          JSON.stringify(clientEstimates),
          expiresAt,
        ),
      db
        .prepare(
          `INSERT INTO quotes (
             id, upload_id, status, material, color, quality, infill_percent,
             quantity, currency, expires_at
           ) VALUES (?, ?, 'pending_review', ?, ?, ?, ?, ?, 'USD', ?)`,
        )
        .bind(
          quoteId,
          uploadId,
          material,
          color,
          quality,
          infillPercent,
          quantity,
          expiresAt,
        ),
    ]);

    return json(
      {
        upload: {
          id: uploadId,
          accessToken,
          filename: originalFilename,
          format,
          byteSize: candidate.size,
          status: "received",
          expiresAt,
        },
        quote: {
          id: quoteId,
          status: "pending_review",
          quotedPriceCents: null,
          currency: "USD",
          message: "Your model was received and is waiting for a printability review.",
        },
      },
      201,
    );
  } catch (error) {
    if (uploadedObjectKey) {
      try {
        await getUploadsBucket().delete(uploadedObjectKey);
      } catch (cleanupError) {
        console.error("Unable to clean up orphaned upload", cleanupError);
      }
    }
    return handleApiError(error);
  }
}
