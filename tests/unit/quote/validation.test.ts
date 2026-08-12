import { describe, expect, test } from "vitest";
import { DEFAULT_PRICING_CONFIG } from "@/lib/quote/config";
import type { GeometryReport } from "@/lib/quote/types";
import {
  parseQuoteSelection,
  QuoteValidationError,
  validateGeometryReport,
} from "@/lib/quote/validation";

function geometry(overrides: Partial<GeometryReport> = {}): GeometryReport {
  return {
    fileName: "cube.stl",
    fileSizeBytes: 684,
    format: "binary",
    triangleCount: 12,
    dimensionsMm: { x: 10, y: 10, z: 10 },
    volumeCm3: 1,
    surfaceAreaCm2: 6,
    warnings: [],
    ...overrides,
  };
}

function fieldErrors(
  material: string | null,
  quality: string | null,
  quantity: string | null,
): Record<string, string> {
  try {
    parseQuoteSelection(material, quality, quantity);
  } catch (error) {
    expect(error).toBeInstanceOf(QuoteValidationError);
    return (error as QuoteValidationError).fieldErrors ?? {};
  }
  throw new Error("Expected parseQuoteSelection to reject the selection.");
}

describe("parseQuoteSelection", () => {
  test("accepts a supported selection and coerces the quantity", () => {
    expect(parseQuoteSelection("petg", "fine", " 3 ")).toEqual({
      material: "petg",
      quality: "fine",
      quantity: 3,
    });
  });

  test("accepts the maximum quantity", () => {
    const max = DEFAULT_PRICING_CONFIG.maxQuantity;

    expect(parseQuoteSelection("pla", "standard", String(max)).quantity).toBe(
      max,
    );
  });

  test("reports every invalid field at once", () => {
    expect(fieldErrors("resin", "ultra", "0")).toEqual({
      material: "Choose a supported material.",
      quality: "Choose a supported print quality.",
      quantity: `Quantity must be a whole number from 1 to ${DEFAULT_PRICING_CONFIG.maxQuantity}.`,
    });
  });

  test("rejects missing values", () => {
    expect(Object.keys(fieldErrors(null, null, null))).toEqual([
      "material",
      "quality",
      "quantity",
    ]);
  });

  test.each([
    ["empty", ""],
    ["blank", "   "],
    ["fractional", "1.5"],
    ["non-numeric", "two"],
    ["zero", "0"],
    ["negative", "-2"],
    ["above the maximum", `${DEFAULT_PRICING_CONFIG.maxQuantity + 1}`],
  ])("rejects a %s quantity", (_label, quantity) => {
    expect(fieldErrors("pla", "standard", quantity)).toHaveProperty("quantity");
  });

  test("rejects non-string form values", () => {
    const file = new File(["x"], "cube.stl");

    expect(Object.keys(fieldErrors(file as never, file as never, file as never))).toEqual([
      "material",
      "quality",
      "quantity",
    ]);
  });
});

describe("validateGeometryReport", () => {
  test("accepts a well-formed report", () => {
    expect(() => validateGeometryReport(geometry())).not.toThrow();
  });

  test("rejects non-finite or negative measurements", () => {
    expect(() =>
      validateGeometryReport(geometry({ volumeCm3: Number.NaN })),
    ).toThrow(/invalid geometry values/);
    expect(() =>
      validateGeometryReport(geometry({ surfaceAreaCm2: -1 })),
    ).toThrow(/invalid geometry values/);
    expect(() =>
      validateGeometryReport(
        geometry({ dimensionsMm: { x: 10, y: 10, z: Infinity } }),
      ),
    ).toThrow(/invalid geometry values/);
  });

  test("rejects triangle counts outside the supported range", () => {
    expect(() => validateGeometryReport(geometry({ triangleCount: 0 }))).toThrow(
      /between 1 and/,
    );
    expect(() =>
      validateGeometryReport(
        geometry({
          triangleCount: DEFAULT_PRICING_CONFIG.maxTriangleCount + 1,
        }),
      ),
    ).toThrow(/between 1 and/);
  });

  test("rejects a mesh without measurable volume", () => {
    expect(() =>
      validateGeometryReport(geometry({ volumeCm3: 0.000_000_5 })),
    ).toThrow(/no measurable enclosed volume/);
  });

  test("rejects a flat mesh", () => {
    expect(() =>
      validateGeometryReport(
        geometry({ dimensionsMm: { x: 10, y: 10, z: 0 } }),
      ),
    ).toThrow(/flat or incomplete/);
  });
});

describe("QuoteValidationError", () => {
  test("carries its name and optional field errors", () => {
    const error = new QuoteValidationError("bad", { file: "required" });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("QuoteValidationError");
    expect(error.fieldErrors).toEqual({ file: "required" });
    expect(new QuoteValidationError("bad").fieldErrors).toBeUndefined();
  });
});
