export type ProductCategory =
  | 'Gifts & Personalization'
  | 'Plants & Decor'
  | 'Gaming & Hobbies'
  | 'Seasonal'
  | 'Business & Events'
  | 'Custom 3D Print';

export type PersonalizationFieldType = 'text' | 'textarea' | 'select' | 'date' | 'url' | 'file';

export type PersonalizationField = {
  key: string;
  label: string;
  type: PersonalizationFieldType;
  required: boolean;
  maxLength?: number;
  options?: string[];
  placeholder?: string;
};

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
  sizes?: string[];
  leadTimeDays: { min: number; max: number };
  printTimeHours?: { min: number; max: number };
  dimensions?: string;
  featured: boolean;
  badge?: string;
  imageUrl?: string;
  personalization?: PersonalizationField[];
  includedItems?: string[];
  careInstructions?: string[];
  safetyWarnings?: string[];
  minimumQuantity?: number;
};

export type SelectedFile = { uri: string; name: string; mimeType?: string | null };

export type ProductOptions = {
  color?: string;
  material?: string;
  size?: string;
  values?: Record<string, string>;
  files?: Record<string, SelectedFile>;
  rightsConfirmed?: boolean;
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
  breakdown: Record<string, number> & { totalCents: number };
  productionReviewRequired: true;
  assumptions: string[];
  warnings: string[];
};

export type OrderSummary = {
  orderNumber: string;
  trackingToken: string;
  status: string;
  paymentStatus: string;
  amounts: {
    subtotalCents: number;
    shippingCents: number;
    taxCents: number;
    discountCents: number;
    totalCents: number;
    currency: string;
  };
  createdAt: string;
};

export type OrderDetail = Omit<OrderSummary, 'trackingToken'> & {
  fulfillmentMethod: string;
  updatedAt: string;
  items: {
    id: string;
    sku: string;
    name: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
    personalization: Record<string, unknown>;
  }[];
  timeline: { status: string; note?: string | null; createdAt: string }[];
};

export type CheckoutDetails = {
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  fulfillmentMethod: 'shipping' | 'pickup';
  shippingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: 'US';
  };
};
