import {
  DEFAULT_PRICING_CONFIG,
  type QuotePricingConfig,
} from "./config";
import type {
  GeometryReport,
  MoneyBreakdown,
  QuoteEstimate,
  QuoteSelection,
} from "./types";
import { validateGeometryReport } from "./validation";

interface QuoteCalculationOptions {
  quoteId: string;
  now?: Date;
  config?: Readonly<QuotePricingConfig>;
}

function cents(value: number): number {
  return Math.max(0, Math.round(value));
}

function decimal(value: number, places = 2): number {
  const scale = 10 ** places;
  return Math.round(value * scale) / scale;
}

export function calculateQuote(
  geometry: GeometryReport,
  selection: QuoteSelection,
  options: QuoteCalculationOptions,
): QuoteEstimate {
  validateGeometryReport(geometry);
  const config = options.config ?? DEFAULT_PRICING_CONFIG;
  const material = config.materials[selection.material];
  const quality = config.qualities[selection.quality];

  if (!material || !quality) {
    throw new Error("Unsupported quote configuration.");
  }

  const effectiveSolidFraction =
    config.assumedShellSolidFraction +
    (1 - config.assumedShellSolidFraction) * quality.infillRatio;
  const effectiveVolumePerUnitCm3 = geometry.volumeCm3 * effectiveSolidFraction;
  const estimatedMaterialGrams =
    effectiveVolumePerUnitCm3 *
    material.densityGramsPerCm3 *
    (1 + config.materialWasteRate) *
    selection.quantity;
  const estimatedMachineHours =
    Math.max(
      config.minimumMachineHoursPerUnit,
      (effectiveVolumePerUnitCm3 / config.depositionRateCm3PerHour) *
        quality.timeMultiplier,
    ) * selection.quantity;

  const materialCents = cents(
    estimatedMaterialGrams * material.spoolCostCentsPerGram,
  );
  const machineCents = cents(
    estimatedMachineHours * config.machineCentsPerHour,
  );
  const laborMinutes =
    config.baseLaborMinutes +
    config.handlingMinutesPerUnit * selection.quantity;
  const laborCents = cents((laborMinutes / 60) * config.laborCentsPerHour);
  const packagingCents = cents(
    config.basePackagingCents +
      Math.max(0, selection.quantity - 1) *
        config.additionalUnitPackagingCents,
  );
  const directCostCents =
    materialCents + machineCents + laborCents + packagingCents;
  const failureReserveCents = cents(
    directCostCents * config.failureReserveRate,
  );
  const riskAdjustedCostCents = directCostCents + failureReserveCents;
  const requiredNetRevenueCents = Math.ceil(
    riskAdjustedCostCents / (1 - config.targetMarginRate),
  );
  const grossPriceBeforeMinimumCents = Math.ceil(
    (requiredNetRevenueCents + config.stripeFixedFeeCents) /
      (1 - config.stripePercentageRate),
  );
  const totalCents = Math.max(
    config.minimumOrderCents,
    grossPriceBeforeMinimumCents,
  );
  const paymentProcessingCents = cents(
    totalCents * config.stripePercentageRate + config.stripeFixedFeeCents,
  );
  const minimumPriceAdjustmentCents = Math.max(
    0,
    config.minimumOrderCents - grossPriceBeforeMinimumCents,
  );
  const marginAllowanceCents = Math.max(
    0,
    totalCents -
      paymentProcessingCents -
      riskAdjustedCostCents -
      minimumPriceAdjustmentCents,
  );

  const breakdown: MoneyBreakdown = {
    materialCents,
    machineCents,
    laborCents,
    packagingCents,
    failureReserveCents,
    marginAllowanceCents,
    paymentProcessingCents,
    minimumPriceAdjustmentCents,
    totalCents,
  };
  const createdAt = options.now ?? new Date();
  const expiresAt = new Date(createdAt.getTime() + 60 * 60 * 1_000);

  return {
    quoteId: options.quoteId,
    currency: config.currency,
    estimateLabel: "Planning estimate — production approval required",
    expiresAt: expiresAt.toISOString(),
    selection,
    geometry,
    estimatedMaterialGrams: decimal(estimatedMaterialGrams, 1),
    estimatedMachineHours: decimal(estimatedMachineHours, 1),
    breakdown,
    productionReviewRequired: true,
    assumptions: [
      `${Math.round(quality.infillRatio * 100)}% infill with an estimated ${Math.round(config.assumedShellSolidFraction * 100)}% solid shell share.`,
      `${Math.round(config.materialWasteRate * 100)}% purge and handling material allowance.`,
      `${Math.round(config.failureReserveRate * 100)}% failure reserve and ${Math.round(config.targetMarginRate * 100)}% target margin on net receipts.`,
      "Shipping and applicable tax are not included.",
    ],
    warnings: [...geometry.warnings],
  };
}

