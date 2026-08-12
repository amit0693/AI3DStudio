import { beforeEach, describe, expect, test, vi } from "vitest";

type BoundStatement = { run: () => Promise<unknown> };

const run = vi.fn<() => Promise<unknown>>();
const bind = vi.fn<(...values: unknown[]) => BoundStatement>(() => ({ run }));
const prepare = vi.fn<(sql: string) => { bind: typeof bind }>(() => ({ bind }));
const getD1 = vi.fn(() => ({ prepare }));

vi.mock("@/db", () => ({ getD1: () => getD1() }));

const { POST } = await import("@/app/api/waitlist/route");

function waitlistRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request("https://baylayer.test/api/waitlist", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

const validBody = {
  email: "Person@Example.com",
  name: "Person",
  feature: "ai-scan",
  city: "Oakland",
  phoneType: "IPHONE",
  intendedObject: "A bike mount",
  source: "website",
  marketingConsent: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  run.mockResolvedValue({ success: true });
  bind.mockReturnValue({ run });
  prepare.mockReturnValue({ bind });
  getD1.mockReturnValue({ prepare });
});

describe("POST /api/waitlist", () => {
  test("stores a normalised entry and returns 201", async () => {
    const response = await POST(waitlistRequest(validBody));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      joined: true,
      feature: "ai-scan",
      message: "You're on the early-access list.",
    });

    const [id, email, name, feature, city, phoneType, intendedObject, source] =
      bind.mock.calls[0];
    expect(id).toMatch(/^wait_[0-9a-f-]{36}$/);
    expect(email).toBe("person@example.com");
    expect(name).toBe("Person");
    expect(feature).toBe("ai-scan");
    expect(city).toBe("Oakland");
    expect(phoneType).toBe("iphone");
    expect(intendedObject).toBe("A bike mount");
    expect(source).toBe("website");
    expect(prepare.mock.calls[0][0]).toContain("INSERT INTO waitlist_entries");
    expect(run).toHaveBeenCalledOnce();
  });

  test("defaults the feature and source for a minimal submission", async () => {
    const response = await POST(
      waitlistRequest({ email: "a@example.com", marketingConsent: true }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({ feature: "ai-scan" });
    const [, , name, feature, city, phoneType, intendedObject, source] =
      bind.mock.calls[0];
    expect(name).toBeNull();
    expect(feature).toBe("ai-scan");
    expect(city).toBeNull();
    expect(phoneType).toBeNull();
    expect(intendedObject).toBeNull();
    expect(source).toBe("website");
  });

  test("requires marketing consent", async () => {
    const response = await POST(
      waitlistRequest({ ...validBody, marketingConsent: "yes" }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Consent is required to join the email waitlist.",
    });
    expect(run).not.toHaveBeenCalled();
  });

  test("requires a valid email", async () => {
    const response = await POST(
      waitlistRequest({ ...validBody, email: "not-an-email" }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Enter a valid email address.",
    });
  });

  test("rejects an unsupported feature", async () => {
    const response = await POST(
      waitlistRequest({ ...validBody, feature: "teleporter" }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "feature is invalid.",
    });
  });

  test("rejects an unsupported phone type", async () => {
    const response = await POST(
      waitlistRequest({ ...validBody, phoneType: "blackberry" }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "phoneType must be iphone, android, or other.",
    });
  });

  test("rejects a source with unsafe characters", async () => {
    const response = await POST(
      waitlistRequest({ ...validBody, source: "web site!" }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "source is invalid.",
    });
  });

  test("rejects a non-JSON content type", async () => {
    const response = await POST(
      new Request("https://baylayer.test/api/waitlist", {
        method: "POST",
        headers: { "content-type": "text/plain" },
        body: "email=a@example.com",
      }),
    );

    expect(response.status).toBe(415);
  });

  test("reports 503 when the D1 binding is unavailable", async () => {
    getD1.mockImplementation(() => {
      throw new Error("Cloudflare D1 binding `DB` is unavailable.");
    });

    const response = await POST(waitlistRequest(validBody));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("Commerce storage is not ready yet."),
    });
  });

  test("reports 500 when the insert fails unexpectedly", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    run.mockRejectedValue(new Error("D1_ERROR: constraint failed"));

    const response = await POST(waitlistRequest(validBody));

    expect(response.status).toBe(500);
  });
});
