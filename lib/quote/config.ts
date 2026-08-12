import type { MaterialKey, QualityKey } from "./types";

export interface MaterialPricing {
  label: string;
  densityGramsPerCm3: number;
  spoolCostCentsPerGram: number;
}

export interface QualityPricing {
  label: string;
  infillRatio: number;
  timeMultiplier: number;
}

export interface QuotePricingConfig {
  currency: "USD";
  materials: Record<MaterialKey, MaterialPricing>;
  qualities: Record<QualityKey, QualityPricing>;
  machineCentsPerHour: number;
  laborCentsPerHour: number;
  baseLaborMinutes: number;
  handlingMinutesPerUnit: number;
  basePackagingCents: number;
  additionalUnitPackagingCents: number;
  failureReserveRate: number;
  targetMarginRate: number;
  stripePercentageRate: number;
  stripeFixedFeeCents: number;
  minimumOrderCents: number;
  assumedShellSolidFraction: number;
  materialWasteRate: number;
  depositionRateCm3PerHour: number;
  minimumMachineHoursPerUnit: number;
  maxFileSizeBytes: number;
  maxTriangleCount: number;
  maxQuantity: number;
  printerBuildVolumeMm: readonly [number, number, number];
}

/**
 * Phase 1 operating assumptions. Keep this object server-owned and replace its
 * values with measured shop data as completed jobs are recorded.
 */
export const DEFAULT_PRICING_CONFIG: Readonly<QuotePricingConfig> = {
  currency: "USD",
  materials: {
    pla: {
      label: "PLA",
      densityGramsPerCm3: 1.24,
      spoolCostCentsPerGram: 2.2,
    },
    petg: {
      label: "PETG",
      densityGramsPerCm3: 1.27,
      spoolCostCentsPerGram: 2.8,
    },
    abs: {
      label: "ABS",
      densityGramsPerCm3: 1.04,
      spoolCostCentsPerGram: 3,
    },
  },
  qualities: {
    draft: { label: "Draft · 0.28 mm", infillRatio: 0.15, timeMultiplier: 0.78 },
    standard: {
      label: "Standard · 0.20 mm",
      infillRatio: 0.2,
      timeMultiplier: 1,
    },
    fine: { label: "Fine · 0.12 mm", infillRatio: 0.25, timeMultiplier: 1.55 },
  },
  machineCentsPerHour: 100,
  laborCentsPerHour: 2_500,
  baseLaborMinutes: 12,
  handlingMinutesPerUnit: 2,
  basePackagingCents: 100,
  additionalUnitPackagingCents: 35,
  failureReserveRate: 0.12,
  targetMarginRate: 0.55,
  stripePercentageRate: 0.029,
  stripeFixedFeeCents: 30,
  minimumOrderCents: 1_900,
  assumedShellSolidFraction: 0.32,
  materialWasteRate: 0.07,
  depositionRateCm3PerHour: 9,
  minimumMachineHoursPerUnit: 0.5,
  maxFileSizeBytes: 25 * 1024 * 1024,
  maxTriangleCount: 400_000,
  maxQuantity: 100,
  printerBuildVolumeMm: [250, 250, 250],
};

export const MATERIAL_OPTIONS = Object.entries(
  DEFAULT_PRICING_CONFIG.materials,
) as [MaterialKey, MaterialPricing][];

export const QUALITY_OPTIONS = Object.entries(
  DEFAULT_PRICING_CONFIG.qualities,
) as [QualityKey, QualityPricing][];

