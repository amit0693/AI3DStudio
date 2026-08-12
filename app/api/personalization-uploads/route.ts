import { getD1, getUploadsBucket } from "@/db";
import {
  ApiError,
  handleApiError,
  json,
  randomToken,
  sha256Hex,
} from "../products/_shared";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

function safeFilename(value: string) {
  const leaf = value.split(/[\\/]/).pop() ?? "reference";
  const cleaned = leaf.replace(/[^a-zA-Z0-9 ._()-]/g, "_").trim();
  return (cleaned || "reference").slice(0, 160);
}

function extensionFor(contentType: string) {
  return ({
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/pdf": "pdf",
  } as Record<string, string>)[contentType];
}

function inspectBytes(bytes: ArrayBuffer, contentType: string) {
  const view = new Uint8Array(bytes);
  const valid =
    (contentType === "image/jpeg" && view[0] === 0xff && view[1] === 0xd8 && view[2] === 0xff) ||
    (contentType === "image/png" && view[0] === 0x89 && view[1] === 0x50 && view[2] === 0x4e && view[3] === 0x47) ||
    (contentType === "image/webp" && new TextDecoder().decode(view.slice(0, 4)) === "RIFF" && new TextDecoder().decode(view.slice(8, 12)) === "WEBP") ||
    (contentType === "application/pdf" && new TextDecoder().decode(view.slice(0, 5)) === "%PDF-");
  if (!valid) throw new ApiError(400, "The file contents do not match its declared type.");
}

export async function POST(request: Request) {
  let objectKey: string | null = null;
  try {
    if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("multipart/form-data")) {
      throw new ApiError(415, "Use multipart/form-data with a file field.");
    }
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_FILE_BYTES + 256 * 1024) {
      throw new ApiError(413, "The upload exceeds the 10 MB limit.");
    }
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size < 1 || file.size > MAX_FILE_BYTES) {
      throw new ApiError(400, "Choose a JPG, PNG, WebP, or PDF file up to 10 MB.");
    }
    const contentType = file.type.toLowerCase();
    if (!ALLOWED_TYPES.has(contentType)) {
      throw new ApiError(415, "Choose a JPG, PNG, WebP, or PDF file.");
    }
    const bytes = await file.arrayBuffer();
    inspectBytes(bytes, contentType);
    const id = `asset_${crypto.randomUUID()}`;
    const accessToken = randomToken();
    const accessTokenHash = await sha256Hex(accessToken);
    const checksum = await sha256Hex(bytes);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    objectKey = `personalization/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${id}.${extensionFor(contentType)}`;
    const filename = safeFilename(file.name);

    await getUploadsBucket().put(objectKey, bytes, {
      httpMetadata: { contentType },
      customMetadata: { id, sha256: checksum },
    });
    await getD1()
      .prepare(
        `INSERT INTO personalization_uploads
           (id, object_key, access_token_hash, original_filename, content_type,
            byte_size, sha256, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(id, objectKey, accessTokenHash, filename, contentType, file.size, checksum, expiresAt)
      .run();

    return json({ upload: { id, accessToken, filename, contentType, byteSize: file.size, expiresAt } }, 201);
  } catch (error) {
    if (objectKey) {
      try {
        await getUploadsBucket().delete(objectKey);
      } catch (cleanupError) {
        console.error("Unable to clean up personalization upload", cleanupError);
      }
    }
    return handleApiError(error);
  }
}
