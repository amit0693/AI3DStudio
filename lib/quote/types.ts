export type MaterialKey = "pla" | "petg" | "abs";

export type QualityKey = "draft" | "standard" | "fine";

export type StlFormat = "binary" | "ascii";

export interface DimensionsMm {
  x: number;
  y: number;
  z: number;
}

export interface GeometryReport {
  fileName: string;
  fileSizeBytes: number;
  format: StlFormat;
  triangleCount: number;
  dimensionsMm: DimensionsMm;
  volumeCm3: number;
  surfaceAreaCm2: number;
  warnings: string[];
}

export interface QuoteSelection {
  material: MaterialKey;
  quality: QualityKey;
  quantity: number;
}

export interface MoneyBreakdown {
  materialCents: number;
  machineCents: number;
  laborCents: number;
  packagingCents: number;
  failureReserveCents: number;
  marginAllowanceCents: number;
  paymentProcessingCents: number;
  minimumPriceAdjustmentCents: number;
  totalCents: number;
}

export interface QuoteEstimate {
  quoteId: string;
  currency: "USD";
  estimateLabel: string;
  expiresAt: string;
  selection: QuoteSelection;
  geometry: GeometryReport;
  estimatedMaterialGrams: number;
  estimatedMachineHours: number;
  breakdown: MoneyBreakdown;
  productionReviewRequired: true;
  assumptions: string[];
  warnings: string[];
}

export interface QuoteErrorResponse {
  error: string;
  fieldErrors?: Record<string, string>;
}

