import { beforeEach, describe, expect, test, vi } from "vitest";
import { sha256Hex } from "@/app/api/products/_shared";
import { binaryStlBuffer, boxTriangles } from "../helpers/stl";
import { createD1Fake, type D1Fake } from "../helpers/d1";

let d1: D1Fake;
let bucket: {
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

vi.mock("@/db", () => ({
  getD1: () => d1.database,
  getUploadsBucket: () => bucket,
}));

const { POST } = await import("@/app/api/uploads/route");
const { GET } = await import("@/app/api/uploads/[id]/route");

const stlBytes = binaryStlBuffer(boxTriangles(10));

function stlFile(name = "cube.stl", type = "model/stl") {
  return new File([stlBytes], name, { type });
}

function uploadForm(overrides: Record<string, string | File | null> = {}) {
  const form = new FormData();
  form.set("file", stlFile());
  for (const [key, value] of Object.entries(overrides)) {
    if (value === null) form.delete(key);
    else form.set(key, value);
  }
  return form;
}

function uploadRequest(form: FormData) {
  return new Request("https://baylayer.test/api/uploads", {
    method: "POST",
    body: form,
  });
}

beforeEach(() => {
  d1 = createD1Fake();
  bucket = { put: vi.fn(async () => ({})), delete: vi.fn(async () => {}) };
});

describe("POST /api/uploads", () => {
  test("stores the model in R2 and records the upload and quote", async () => {
    const response = await POST(uploadRequest(uploadForm()));

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.upload).toMatchObject({
      filename: "cube.stl",
      format: "stl",
      status: "received",
      byteSize: stlBytes.byteLength,
    });
    expect(body.upload.id).toMatch(/^upl_/);
    expect(body.upload.accessToken).toMatch(/^[0-9a-f]{64}$/);
    expect(body.quote).toMatchObject({
      status: "pending_review",
      quotedPriceCents: null,
      currency: "USD",
    });

    const [objectKey, , options] = bucket.put.mock.calls[0];
    expect(objectKey).toMatch(/^models\/\d{4}\/\d{2}\/upl_[0-9a-f-]{36}\.stl$/);
    expect(options.httpMetadata.contentType).toBe("model/stl");
    expect(options.customMetadata.sha256).toBe(await sha256Hex(stlBytes));

    const [batch] = d1.batched;
    expect(batch[0].sql).toContain("INSERT INTO uploads");
    expect(batch[0].values).toContain(await sha256Hex(body.upload.accessToken));
    expect(batch[1].sql).toContain("INSERT INTO quotes");
    expect(batch[1].values).toEqual(
      expect.arrayContaining(["PLA", "standard", 20, 1]),
    );
  });

  test("normalises the print options and client estimates", async () => {
    const response = await POST(
      uploadRequest(
        uploadForm({
          email: "Person@Example.com",
          material: "petg",
          color: "Slate",
          quality: "FINE",
          infillPercent: "45",
          quantity: "3",
          widthMm: "120.5",
          heightMm: "60",
          depthMm: "30",
          volumeMm3: "15000",
        }),
      ),
    );

    expect(response.status).toBe(201);
    const [uploadInsert, quoteInsert] = d1.batched[0];
    expect(uploadInsert.values).toContain("person@example.com");
    expect(uploadInsert.values).toContain(
      JSON.stringify({
        widthMm: 120.5,
        heightMm: 60,
        depthMm: 30,
        volumeMm3: 15000,
      }),
    );
    expect(quoteInsert.values).toEqual(
      expect.arrayContaining(["PETG", "Slate", "fine", 45, 3]),
    );
  });

  test("sanitises path traversal and unsafe characters in the filename", async () => {
    const response = await POST(
      uploadRequest(uploadForm({ file: stlFile("../../etc/pa$$wd.stl") })),
    );

    await expect(response.json()).resolves.toMatchObject({
      upload: { filename: "pa__wd.stl" },
    });
  });

  test("accepts OBJ and 3MF models", async () => {
    const obj = new File(["v 0 0 0\nf 1 1 1\n"], "part.obj", {
      type: "text/plain",
    });
    const objResponse = await POST(uploadRequest(uploadForm({ file: obj })));
    expect(objResponse.status).toBe(201);

    const threeMf = new File(
      [new Uint8Array([0x50, 0x4b, 0x03, 0x04])],
      "part.3mf",
      { type: "application/zip" },
    );
    const threeMfResponse = await POST(
      uploadRequest(uploadForm({ file: threeMf })),
    );
    expect(threeMfResponse.status).toBe(201);
  });

  test("rejects a non-multipart request", async () => {
    const response = await POST(
      new Request("https://baylayer.test/api/uploads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      }),
    );

    expect(response.status).toBe(415);
    await expect(response.json()).resolves.toEqual({
      error: "Use multipart/form-data with a file field.",
    });
  });

  test("rejects an upload larger than the multipart limit", async () => {
    const request = uploadRequest(uploadForm());
    request.headers.set("content-length", String(30 * 1024 * 1024));

    const response = await POST(request);

    expect(response.status).toBe(413);
  });

  test("requires a file field", async () => {
    const response = await POST(uploadRequest(uploadForm({ file: null })));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "A model file is required in the file field.",
    });
  });

  test("rejects an empty file", async () => {
    const response = await POST(
      uploadRequest(uploadForm({ file: new File([], "cube.stl") })),
    );

    expect(response.status).toBe(413);
  });

  test("rejects an unsupported extension", async () => {
    const response = await POST(
      uploadRequest(uploadForm({ file: stlFile("cube.gcode") })),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Upload an STL, OBJ, or 3MF model.",
    });
  });

  test("rejects a MIME type that does not match the extension", async () => {
    const response = await POST(
      uploadRequest(uploadForm({ file: stlFile("cube.stl", "image/png") })),
    );

    expect(response.status).toBe(415);
    await expect(response.json()).resolves.toEqual({
      error: "The file type does not match a STL model.",
    });
  });

  test.each([
    [
      "a truncated STL",
      new File([new Uint8Array(40)], "cube.stl", { type: "model/stl" }),
      "The STL file is too small to contain a printable mesh.",
    ],
    [
      "an OBJ without model data",
      new File(["nothing useful here"], "part.obj", { type: "text/plain" }),
      "The OBJ file does not contain recognizable model data.",
    ],
    [
      "a 3MF that is not a ZIP",
      new File([new Uint8Array([1, 2, 3, 4])], "part.3mf", {
        type: "application/zip",
      }),
      "The 3MF file is not a valid ZIP-based model package.",
    ],
  ])("rejects %s", async (_label, file, error) => {
    const response = await POST(uploadRequest(uploadForm({ file })));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error });
    expect(bucket.put).not.toHaveBeenCalled();
  });

  test.each([
    ["material", "resin", "material must be PLA, PETG, or TPU."],
    ["quality", "ultra", "quality must be draft, standard, or fine."],
    [
      "infillPercent",
      "120",
      "infillPercent must be a whole number from 0 to 100.",
    ],
    ["quantity", "0", "quantity must be a whole number from 1 to 100."],
    ["widthMm", "-5", "widthMm is invalid."],
    ["volumeMm3", "not-a-number", "volumeMm3 is invalid."],
  ])("rejects an invalid %s", async (field, value, error) => {
    const response = await POST(uploadRequest(uploadForm({ [field]: value })));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error });
  });

  test("removes the orphaned object when the database write fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    d1.failNextRun(new Error("Insert failed for an unexpected reason."));

    const response = await POST(uploadRequest(uploadForm()));

    expect(response.status).toBe(500);
    expect(bucket.delete).toHaveBeenCalledWith(bucket.put.mock.calls[0][0]);
    vi.restoreAllMocks();
  });

  test("reports 503 when the uploads bucket is unavailable", async () => {
    bucket.put.mockRejectedValue(
      new Error("Cloudflare R2 binding `UPLOADS` is unavailable."),
    );

    const response = await POST(uploadRequest(uploadForm()));

    expect(response.status).toBe(503);
  });
});

describe("GET /api/uploads/[id]", () => {
  const accessToken = "a".repeat(64);
  const uploadId = "upl_00000000-0000-4000-8000-000000000000";

  async function statusRow(overrides: Record<string, unknown> = {}) {
    return {
      id: uploadId,
      access_token_hash: await sha256Hex(accessToken),
      original_filename: "cube.stl",
      format: "stl",
      byte_size: 684,
      status: "received",
      client_estimates_json: '{"widthMm":10}',
      rejection_reason: null,
      expires_at: "2026-02-01T00:00:00.000Z",
      created_at: "2026-01-01T00:00:00.000Z",
      quote_id: "qte_1",
      quote_status: "pending_review",
      material: "PLA",
      color: null,
      quality: "standard",
      infill_percent: 20,
      quantity: 1,
      quoted_price_cents: null,
      currency: "USD",
      quote_expires_at: "2026-02-01T00:00:00.000Z",
      ...overrides,
    };
  }

  function statusRequest(token: string | null = accessToken) {
    return new Request(`https://baylayer.test/api/uploads/${uploadId}`, {
      headers: token ? { "x-upload-token": token } : {},
    });
  }

  test("returns the upload and its latest quote", async () => {
    d1.respond(/FROM uploads u/, [await statusRow()]);

    const response = await GET(statusRequest(), {
      params: Promise.resolve({ id: uploadId }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      upload: {
        id: uploadId,
        filename: "cube.stl",
        format: "stl",
        byteSize: 684,
        status: "received",
        clientEstimates: { widthMm: 10 },
        rejectionReason: null,
        expiresAt: "2026-02-01T00:00:00.000Z",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      quote: {
        id: "qte_1",
        status: "pending_review",
        material: "PLA",
        color: null,
        quality: "standard",
        infillPercent: 20,
        quantity: 1,
        quotedPriceCents: null,
        currency: "USD",
        expiresAt: "2026-02-01T00:00:00.000Z",
      },
    });
  });

  test("returns a null quote when none exists yet", async () => {
    d1.respond(/FROM uploads u/, [await statusRow({ quote_id: null })]);

    const response = await GET(statusRequest(), {
      params: Promise.resolve({ id: uploadId }),
    });

    await expect(response.json()).resolves.toMatchObject({ quote: null });
  });

  test("hides the upload from a mismatched token", async () => {
    d1.respond(/FROM uploads u/, [await statusRow()]);

    const response = await GET(statusRequest("b".repeat(64)), {
      params: Promise.resolve({ id: uploadId }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Upload not found.",
    });
  });

  test("returns 404 for an unknown upload", async () => {
    d1.respond(/FROM uploads u/, []);

    const response = await GET(statusRequest(), {
      params: Promise.resolve({ id: uploadId }),
    });

    expect(response.status).toBe(404);
  });

  test.each([
    ["a malformed id", "upload-1", accessToken],
    ["a missing token", uploadId, null],
    ["a malformed token", uploadId, "short-token"],
  ])("returns 404 for %s without querying D1", async (_label, id, token) => {
    const response = await GET(statusRequest(token), {
      params: Promise.resolve({ id }),
    });

    expect(response.status).toBe(404);
    expect(d1.calls).toHaveLength(0);
  });
});
