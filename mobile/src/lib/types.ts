export type Product = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  shortDescription: string;
  description: string;
  category: string;
  productType: string;
  price: { amountCents: number; compareAtAmountCents?: number | null; currency: string };
  material: string;
  leadTimeDays: { min: number; max: number };
  featured: boolean;
};

export type CartItem = { product: Product; quantity: number };
export type MaterialKey = 'pla' | 'petg' | 'abs';
export type QualityKey = 'draft' | 'standard' | 'fine';

export type QuoteEstimate = {
  quoteId: string;
  currency: 'USD';
  estimateLabel: string;
  expiresAt: string;
  selection: { material: MaterialKey; quality: QualityKey; quantity: number };
  geometry: {
    fileName: string;
    fileSizeBytes: number;
    format: 'binary' | 'ascii';
    triangleCount: number;
    dimensionsMm: { x: number; y: number; z: number };
    volumeCm3: number;
    surfaceAreaCm2: number;
    warnings: string[];
  };
  estimatedMaterialGrams: number;
  estimatedMachineHours: number;
  breakdown: {
    materialCents: number;
    machineCents: number;
    laborCents: number;
    packagingCents: number;
    failureReserveCents: number;
    marginAllowanceCents: number;
    paymentProcessingCents: number;
    minimumPriceAdjustmentCents: number;
    totalCents: number;
  };
  productionReviewRequired: true;
  assumptions: string[];
  warnings: string[];
};
