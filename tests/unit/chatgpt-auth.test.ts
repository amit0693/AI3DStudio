import { beforeEach, describe, expect, test, vi } from "vitest";

const headersMock = vi.fn<() => Promise<Headers>>();
const redirectMock = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});

vi.mock("next/headers", () => ({ headers: () => headersMock() }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirectMock(path),
}));

const {
  chatGPTSignInPath,
  chatGPTSignOutPath,
  getChatGPTUser,
  requireChatGPTUser,
} = await import("@/app/chatgpt-auth");

function setRequestHeaders(values: Record<string, string>) {
  headersMock.mockResolvedValue(new Headers(values));
}

beforeEach(() => {
  vi.clearAllMocks();
  setRequestHeaders({});
});

describe("getChatGPTUser", () => {
  test("returns null when the identity headers are absent", async () => {
    await expect(getChatGPTUser()).resolves.toBeNull();
  });

  test("returns null when only one identity header is present", async () => {
    setRequestHeaders({ "oai-authenticated-user-id": "user_1" });
    await expect(getChatGPTUser()).resolves.toBeNull();

    setRequestHeaders({ "oai-authenticated-user-email": "a@example.com" });
    await expect(getChatGPTUser()).resolves.toBeNull();
  });

  test("falls back to the email as display name without a full name", async () => {
    setRequestHeaders({
      "oai-authenticated-user-id": "user_1",
      "oai-authenticated-user-email": "a@example.com",
    });

    await expect(getChatGPTUser()).resolves.toEqual({
      userId: "user_1",
      email: "a@example.com",
      displayName: "a@example.com",
      fullName: null,
    });
  });

  test("decodes a percent-encoded full name", async () => {
    setRequestHeaders({
      "oai-authenticated-user-id": "user_1",
      "oai-authenticated-user-email": "a@example.com",
      "oai-authenticated-user-full-name": "Am%C3%A9lie%20Dupont",
      "oai-authenticated-user-full-name-encoding": "percent-encoded-utf-8",
    });

    const user = await getChatGPTUser();

    expect(user?.fullName).toBe("Amélie Dupont");
    expect(user?.displayName).toBe("Amélie Dupont");
  });

  test("ignores a full name sent without the expected encoding header", async () => {
    setRequestHeaders({
      "oai-authenticated-user-id": "user_1",
      "oai-authenticated-user-email": "a@example.com",
      "oai-authenticated-user-full-name": "Amelie",
    });

    await expect(getChatGPTUser()).resolves.toMatchObject({ fullName: null });
  });

  test("ignores a malformed percent-encoded full name", async () => {
    setRequestHeaders({
      "oai-authenticated-user-id": "user_1",
      "oai-authenticated-user-email": "a@example.com",
      "oai-authenticated-user-full-name": "%E0%A4%A",
      "oai-authenticated-user-full-name-encoding": "percent-encoded-utf-8",
    });

    const user = await getChatGPTUser();

    expect(user?.fullName).toBeNull();
    expect(user?.displayName).toBe("a@example.com");
  });
});

describe("requireChatGPTUser", () => {
  test("returns the signed-in user without redirecting", async () => {
    setRequestHeaders({
      "oai-authenticated-user-id": "user_1",
      "oai-authenticated-user-email": "a@example.com",
    });

    await expect(requireChatGPTUser("/orders")).resolves.toMatchObject({
      userId: "user_1",
    });
    expect(redirectMock).not.toHaveBeenCalled();
  });

  test("redirects anonymous visitors to sign in with the return path", async () => {
    await expect(requireChatGPTUser("/orders?tab=open")).rejects.toThrow(
      /NEXT_REDIRECT/,
    );
    expect(redirectMock).toHaveBeenCalledWith(
      "/signin-with-chatgpt?return_to=%2Forders%3Ftab%3Dopen",
    );
  });
});

describe("chatGPTSignInPath", () => {
  test("preserves a relative path with its query and hash", () => {
    expect(chatGPTSignInPath("/orders?tab=open#top")).toBe(
      "/signin-with-chatgpt?return_to=%2Forders%3Ftab%3Dopen%23top",
    );
  });

  test.each([
    ["absolute URL", "https://evil.example/steal"],
    ["protocol-relative URL", "//evil.example/steal"],
    ["backslash path", "\\evil.example"],
    ["relative path", "orders"],
    ["empty string", ""],
  ])("falls back to the site root for %s", (_label, value) => {
    expect(chatGPTSignInPath(value)).toBe("/signin-with-chatgpt?return_to=%2F");
  });

  test.each(["/signin-with-chatgpt", "/signout-with-chatgpt", "/callback"])(
    "refuses to loop back to the reserved auth path %s",
    (path) => {
      expect(chatGPTSignInPath(path)).toBe("/signin-with-chatgpt?return_to=%2F");
    },
  );
});

describe("chatGPTSignOutPath", () => {
  test("defaults to the site root", () => {
    expect(chatGPTSignOutPath()).toBe("/signout-with-chatgpt?return_to=%2F");
  });

  test("keeps a safe relative return path", () => {
    expect(chatGPTSignOutPath("/account")).toBe(
      "/signout-with-chatgpt?return_to=%2Faccount",
    );
  });

  test("rejects an off-site return path", () => {
    expect(chatGPTSignOutPath("https://evil.example")).toBe(
      "/signout-with-chatgpt?return_to=%2F",
    );
  });
});
