import { describe, expect, test } from "vitest";
import { calculateQuote } from "@/lib/quote/calculator";
import { DEFAULT_PRICING_CONFIG } from "@/lib/quote/config";
import type {
  GeometryReport,
  QuoteSelection,
} from "@/lib/quote/types";

const NOW = new Date("2026-01-01T00:00:00.000Z");

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

function selection(overrides: Partial<QuoteSelection> = {}): QuoteSelection {
  return { material: "pla", quality: "standard", quantity: 1, ...overrides };
}

function quote(
  geometryOverrides: Partial<GeometryReport> = {},
  selectionOverrides: Partial<QuoteSelection> = {},
) {
  return calculateQuote(
    geometry(geometryOverrides),
    selection(selectionOverrides),
    { quoteId: "quote_1", now: NOW },
  );
}

describe("calculateQuote", () => {
  test("returns a complete, review-gated estimate", () => {
    const estimate = quote();

    expect(estimate.quoteId).toBe("quote_1");
    expect(estimate.currency).toBe("USD");
    expect(estimate.productionReviewRequired).toBe(true);
    expect(estimate.expiresAt).toBe("2026-01-01T01:00:00.000Z");
    expect(estimate.assumptions).toHaveLength(4);
    expect(estimate.selection).toEqual(selection());
  });

  test("defaults the created timestamp to now when none is supplied", () => {
    const before = Date.now();
    const estimate = calculateQuote(geometry(), selection(), {
      quoteId: "quote_1",
    });

    expect(Date.parse(estimate.expiresAt)).toBeGreaterThanOrEqual(
      before + 60 * 60 * 1_000,
    );
  });

  test("never prices below the configured order minimum", () => {
    const estimate = quote({ volumeCm3: 0.01 });

    expect(estimate.breakdown.totalCents).toBeGreaterThanOrEqual(
      DEFAULT_PRICING_CONFIG.minimumOrderCents,
    );
  });

  test("lifts a cheap quote to the minimum and records the adjustment", () => {
    const minimumOrderCents = 25_000;
    const estimate = calculateQuote(geometry({ volumeCm3: 0.01 }), selection(), {
      quoteId: "quote_1",
      now: NOW,
      config: { ...DEFAULT_PRICING_CONFIG, minimumOrderCents },
    });

    expect(estimate.breakdown.totalCents).toBe(minimumOrderCents);
    expect(estimate.breakdown.minimumPriceAdjustmentCents).toBeGreaterThan(0);
  });

  test("breaks the total down into components that reconcile", () => {
    const estimate = quote({ volumeCm3: 400 }, { quantity: 4 });
    const {
      materialCents,
      machineCents,
      laborCents,
      packagingCents,
      failureReserveCents,
      marginAllowanceCents,
      paymentProcessingCents,
      minimumPriceAdjustmentCents,
      totalCents,
    } = estimate.breakdown;

    expect(minimumPriceAdjustmentCents).toBe(0);
    const reconciled =
      materialCents +
      machineCents +
      laborCents +
      packagingCents +
      failureReserveCents +
      marginAllowanceCents +
      paymentProcessingCents;
    expect(Math.abs(reconciled - totalCents)).toBeLessThanOrEqual(2);
  });

  test("keeps the effective margin at or above the target for priced-above-minimum quotes", () => {
    const estimate = quote({ volumeCm3: 400 });
    const { totalCents, paymentProcessingCents, marginAllowanceCents } =
      estimate.breakdown;
    const netRevenue = totalCents - paymentProcessingCents;

    expect(marginAllowanceCents / netRevenue).toBeGreaterThanOrEqual(
      DEFAULT_PRICING_CONFIG.targetMarginRate - 0.01,
    );
  });

  test("scales material and machine estimates with quantity", () => {
    const single = quote({ volumeCm3: 50 });
    const five = quote({ volumeCm3: 50 }, { quantity: 5 });

    expect(five.estimatedMaterialGrams).toBeCloseTo(
      single.estimatedMaterialGrams * 5,
      0,
    );
    expect(five.estimatedMachineHours).toBeCloseTo(
      single.estimatedMachineHours * 5,
      0,
    );
    expect(five.breakdown.packagingCents).toBe(
      DEFAULT_PRICING_CONFIG.basePackagingCents +
        4 * DEFAULT_PRICING_CONFIG.additionalUnitPackagingCents,
    );
  });

  test("applies the per-unit minimum machine time floor", () => {
    const estimate = quote({ volumeCm3: 0.05 }, { quantity: 3 });

    expect(estimate.estimatedMachineHours).toBeCloseTo(
      DEFAULT_PRICING_CONFIG.minimumMachineHoursPerUnit * 3,
      1,
    );
  });

  test("prices denser materials above lighter ones", () => {
    const pla = quote({ volumeCm3: 200 }, { material: "pla" });
    const petg = quote({ volumeCm3: 200 }, { material: "petg" });

    expect(petg.breakdown.materialCents).toBeGreaterThan(
      pla.breakdown.materialCents,
    );
  });

  test("prices finer quality above draft quality", () => {
    const draft = quote({ volumeCm3: 200 }, { quality: "draft" });
    const fine = quote({ volumeCm3: 200 }, { quality: "fine" });

    expect(fine.breakdown.machineCents).toBeGreaterThan(
      draft.breakdown.machineCents,
    );
    expect(fine.breakdown.totalCents).toBeGreaterThan(
      draft.breakdown.totalCents,
    );
  });

  test("passes geometry warnings through to the estimate", () => {
    const warnings = ["Thin walls detected."];
    const estimate = quote({ warnings });

    expect(estimate.warnings).toEqual(warnings);
    expect(estimate.warnings).not.toBe(warnings);
  });

  test("describes the selected infill in the assumptions", () => {
    const estimate = quote({}, { quality: "draft" });
    const draftInfill = Math.round(
      DEFAULT_PRICING_CONFIG.qualities.draft.infillRatio * 100,
    );

    expect(estimate.assumptions[0]).toContain(`${draftInfill}% infill`);
  });

  test("honours an injected pricing config", () => {
    const estimate = calculateQuote(geometry({ volumeCm3: 200 }), selection(), {
      quoteId: "quote_1",
      now: NOW,
      config: {
        ...DEFAULT_PRICING_CONFIG,
        machineCentsPerHour: DEFAULT_PRICING_CONFIG.machineCentsPerHour * 2,
      },
    });

    expect(estimate.breakdown.machineCents).toBeCloseTo(
      quote({ volumeCm3: 200 }).breakdown.machineCents * 2,
      -0.5,
    );
  });

  test("rejects an unsupported material or quality", () => {
    expect(() =>
      calculateQuote(
        geometry(),
        { ...selection(), material: "resin" as never },
        { quoteId: "quote_1", now: NOW },
      ),
    ).toThrow(/Unsupported quote configuration/);
    expect(() =>
      calculateQuote(
        geometry(),
        { ...selection(), quality: "ultra" as never },
        { quoteId: "quote_1", now: NOW },
      ),
    ).toThrow(/Unsupported quote configuration/);
  });

  test("rejects invalid geometry before pricing", () => {
    expect(() => quote({ volumeCm3: 0 })).toThrow(
      /no measurable enclosed volume/,
    );
  });
});
