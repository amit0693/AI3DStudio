export type ProductCategory =
  | 'Gifts & Personalization'
  | 'Desk & Tech'
  | 'Home & Organization'
  | 'Plants & Decor'
  | 'Gaming & Hobbies'
  | 'Seasonal'
  | 'Business & Events';

export type ProductBadge = 'Best Seller' | 'Personalize' | 'New' | 'Bundle';

export type Product = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  shortDescription: string;
  description: string;
  category: ProductCategory | string;
  productType: string;
  price: { amountCents: number; compareAtAmountCents?: number | null; currency: string };
  material: string;
  materials?: string[];
  colors?: string[];
  leadTimeDays: { min: number; max: number };
  printTimeHours?: { min: number; max: number };
  dimensions?: string;
  featured: boolean;
  badge?: ProductBadge;
  imageUrl?: string;
  personalization?: ('text' | 'photo' | 'logo' | 'date' | 'coordinates' | 'notes')[];
  includedItems?: string[];
  careInstructions?: string[];
  safetyWarnings?: string[];
  minimumQuantity?: number;
};

export type ProductOptions = {
  color?: string;
  material?: string;
  size?: string;
  personalization?: string;
  uploadName?: string;
  notes?: string;
};

export type CartItem = {
  key: string;
  product: Product;
  quantity: number;
  options?: ProductOptions;
};

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
