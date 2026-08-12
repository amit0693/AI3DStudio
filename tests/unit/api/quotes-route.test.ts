import { afterEach, describe, expect, test, vi } from "vitest";
import { POST } from "@/app/api/quotes/route";
import { binaryStlBuffer, boxTriangles } from "../helpers/stl";

const cubeStl = new File([binaryStlBuffer(boxTriangles(10))], "cube.stl");

function quoteRequest(form: FormData) {
  return new Request("https://baylayer.test/api/quotes", {
    method: "POST",
    body: form,
  });
}

function validForm(overrides: Record<string, string | File> = {}) {
  const form = new FormData();
  form.set("file", cubeStl);
  form.set("material", "pla");
  form.set("quality", "standard");
  form.set("quantity", "2");
  for (const [key, value] of Object.entries(overrides)) {
    form.set(key, value);
  }
  return form;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/quotes", () => {
  test("returns a 201 estimate for a valid STL upload", async () => {
    const response = await POST(quoteRequest(validForm()));

    expect(response.status).toBe(201);
    expect(response.headers.get("cache-control")).toBe("no-store");

    const estimate = await response.json();
    expect(estimate.selection).toEqual({
      material: "pla",
      quality: "standard",
      quantity: 2,
    });
    expect(estimate.geometry.dimensionsMm).toEqual({ x: 10, y: 10, z: 10 });
    expect(estimate.breakdown.totalCents).toBeGreaterThan(0);
    expect(estimate.productionReviewRequired).toBe(true);
    expect(estimate.quoteId).toMatch(/^[0-9a-f-]{36}$/);
  });

  test("rejects a non-multipart request with 415", async () => {
    const response = await POST(
      new Request("https://baylayer.test/api/quotes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      }),
    );

    expect(response.status).toBe(415);
    await expect(response.json()).resolves.toEqual({
      error: "Send the STL and quote options as multipart form data.",
    });
  });

  test("requires an uploaded file", async () => {
    const form = validForm();
    form.delete("file");
    const response = await POST(quoteRequest(form));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "An STL file is required.",
      fieldErrors: { file: "Choose an STL file to quote." },
    });
  });

  test("returns field errors for an invalid selection", async () => {
    const response = await POST(
      quoteRequest(validForm({ material: "resin", quantity: "0" })),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.fieldErrors).toHaveProperty("material");
    expect(body.fieldErrors).toHaveProperty("quantity");
  });

  test("returns 400 when the uploaded mesh cannot be quoted", async () => {
    const form = validForm({
      file: new File([binaryStlBuffer(boxTriangles(10, 10, 0))], "flat.stl"),
    });
    const response = await POST(quoteRequest(form));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(/flat or incomplete|enclosed volume/),
    });
  });

  test("returns 500 for unexpected failures", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const request = quoteRequest(validForm());
    vi.spyOn(request, "formData").mockRejectedValue(new Error("boom"));

    const response = await POST(request);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "We could not inspect this file. Please try another STL.",
    });
  });
});
