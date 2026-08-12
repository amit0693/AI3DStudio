import type { PersonalizationField, Product, ProductCategory } from './types';

const giftColors = ['Cream', 'Forest', 'Rose', 'Ocean', 'Charcoal'];
const colors = ['Forest', 'Cream', 'Terracotta', 'Ocean', 'Charcoal'];

type LaunchSeed = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  shortDescription: string;
  description: string;
  category: ProductCategory;
  productType: string;
  amountCents: number;
  material: string;
  colors: string[];
  leadTime: [number, number];
  personalization: PersonalizationField[];
  minimumQuantity?: number;
  safety?: string;
};

const field = (key: string, label: string, type: PersonalizationField['type'], required = false, extra: Partial<PersonalizationField> = {}): PersonalizationField => ({ key, label, type, required, ...extra });

const launch: LaunchSeed[] = [
  {
    id: 'PG-01', slug: 'custom-photo-lithophane-night-light', sku: 'BL-LITHO-001', name: 'Photo Lithophane Night Light',
    shortDescription: 'Turn a favorite photo into a softly glowing keepsake.',
    description: 'Upload a photo, choose its orientation and add an optional caption. We review the image before production.',
    category: 'Gifts & Personalization', productType: 'personalized', amountCents: 3999, material: 'PLA', colors: giftColors, leadTime: [3, 5],
    personalization: [field('photo', 'Photo', 'file', true), field('orientation', 'Orientation', 'select', true, { options: ['Portrait', 'Landscape'] }), field('caption', 'Caption', 'text', false, { maxLength: 60 })],
    safety: 'Use only with the included low-heat LED light.',
  },
  {
    id: 'PG-05', slug: 'pet-memorial-silhouette-stand', sku: 'BL-PET-001', name: 'Pet Memorial Silhouette Stand',
    shortDescription: 'A quiet custom silhouette keepsake made from your pet photo.',
    description: 'Upload a clear pet photo and add a name or short memorial line for review before printing.',
    category: 'Gifts & Personalization', productType: 'personalized', amountCents: 3999, material: 'PLA', colors: giftColors, leadTime: [3, 5],
    personalization: [field('photo', 'Pet photo', 'file', true), field('petName', 'Pet name', 'text', true, { maxLength: 40 }), field('memorialLine', 'Memorial line', 'text', false, { maxLength: 80 })],
  },
  {
    id: 'SE-04', slug: 'teacher-name-desk-sign', sku: 'BL-NAME-001', name: 'Teacher & Office Nameplate',
    shortDescription: 'A personalized nameplate for a classroom, studio, or office.',
    description: 'Choose colors and enter the exact name and role for a proof before production.',
    category: 'Seasonal', productType: 'personalized', amountCents: 2999, material: 'PLA', colors: giftColors, leadTime: [2, 4],
    personalization: [field('name', 'Name', 'text', true, { maxLength: 40 }), field('role', 'Role or room', 'text', false, { maxLength: 60 })],
  },
  {
    id: 'BE-01', slug: 'wedding-place-name', sku: 'BL-WEDDING-001', name: 'Wedding Place Names',
    shortDescription: 'Freestanding guest names that double as personal favors.',
    description: 'Provide one guest name per line. Names are proofed and packed in seating-list order.',
    category: 'Business & Events', productType: 'personalized', amountCents: 349, material: 'PLA', colors: giftColors, leadTime: [4, 7], minimumQuantity: 20,
    personalization: [field('names', 'Guest names', 'textarea', true, { maxLength: 2000 }), field('eventDate', 'Event date', 'date', true)],
  },
  {
    id: 'BE-03', slug: 'qr-review-payment-sign', sku: 'BL-QR-001', name: 'QR / NFC Business Sign',
    shortDescription: 'A branded counter sign configured and test-scanned before delivery.',
    description: 'Add the exact destination URL, business name and optional approved logo. NFC is available as an option.',
    category: 'Business & Events', productType: 'personalized', amountCents: 3499, material: 'PLA + optional NFC', colors, leadTime: [3, 5],
    personalization: [field('destinationUrl', 'Destination URL', 'url', true), field('businessName', 'Business name', 'text', true, { maxLength: 60 }), field('logo', 'Approved logo', 'file'), field('nfc', 'NFC option', 'select', true, { options: ['QR only', 'QR + NFC'] })],
  },
  {
    id: 'CP-02', slug: 'replacement-part-reproduction', sku: 'BL-PART-001', name: 'Replacement-Part Design Service',
    shortDescription: 'Design help for a practical, non-safety-critical replacement.',
    description: 'Send measurements, photos and use details. Checkout covers the design setup; print cost is quoted after review.',
    category: 'Custom 3D Print', productType: 'service', amountCents: 3900, material: 'PETG', colors, leadTime: [5, 8],
    personalization: [field('partDescription', 'Part and use', 'textarea', true, { maxLength: 1000 }), field('dimensions', 'Measurements', 'text', true, { maxLength: 200 }), field('reference', 'Reference photo', 'file', true)],
    safety: 'No automotive safety, medical, electrical, pressure, weapon, or child-safety parts.',
  },
  {
    id: 'GH-04', slug: 'hobby-paint-bottle-rack', sku: 'BL-PAINT-001', name: 'Modular Hobby Paint Rack',
    shortDescription: 'Tiered storage for up to 24 common hobby paints.',
    description: 'Choose the bottle diameter and color so the rack fits the supplies you actually use.',
    category: 'Gaming & Hobbies', productType: 'made_to_order', amountCents: 3999, material: 'PLA', colors, leadTime: [4, 6],
    personalization: [field('bottleDiameter', 'Bottle diameter', 'select', true, { options: ['25 mm', '32 mm', '36 mm'] }), field('layout', 'Layout', 'select', true, { options: ['Straight', 'Corner'] })],
  },
  {
    id: 'PD-01', slug: 'self-watering-planter', sku: 'BL-PLANT-001', name: 'Self-Watering Planter',
    shortDescription: 'A two-piece planter that makes moisture levels easy to check.',
    description: 'Choose a size and color. Each reservoir is leak-tested before packing.',
    category: 'Plants & Decor', productType: 'made_to_order', amountCents: 3199, material: 'PETG', colors, leadTime: [3, 5],
    personalization: [field('size', 'Size', 'select', true, { options: ['Small', 'Medium'] }), field('drainage', 'Inner pot', 'select', true, { options: ['Standard wick', 'Extra drainage'] })],
  },
  {
    id: 'PG-03', slug: 'custom-name-desk-sign', sku: 'BL-DESKSIGN-001', name: 'Custom Name Desk Sign',
    shortDescription: 'A layered nameplate sized, colored, and lettered for their space.',
    description: 'Choose a color and enter the name and optional subtitle for a proof before production.',
    category: 'Gifts & Personalization', productType: 'personalized', amountCents: 2499, material: 'PLA', colors: giftColors, leadTime: [3, 4],
    personalization: [field('name', 'Name', 'text', true, { maxLength: 40 }), field('subtitle', 'Subtitle', 'text', false, { maxLength: 60 })],
  },
  {
    id: 'PG-04', slug: 'personalized-name-bag-tag', sku: 'BL-BAGTAG-001', name: 'Personalized Name Bag Tag',
    shortDescription: 'A durable two-color tag for backpacks, luggage, and everyday carry.',
    description: 'Enter the name to engrave on this two-color tag.',
    category: 'Gifts & Personalization', productType: 'personalized', amountCents: 799, material: 'PETG', colors: giftColors, leadTime: [2, 3],
    personalization: [field('name', 'Name', 'text', true, { maxLength: 20 })],
  },
  {
    id: 'PD-02', slug: 'propagation-station', sku: 'BL-PROP-001', name: 'Propagation Station with Glass Tubes',
    shortDescription: 'A stable three-tube stand for watching new roots take shape.',
    description: 'Choose a color; each stand ships with three glass propagation tubes.',
    category: 'Plants & Decor', productType: 'made_to_order', amountCents: 2999, material: 'PETG + glass', colors, leadTime: [4, 5],
    personalization: [],
  },
  {
    id: 'PD-03', slug: 'geometric-planter-trio', sku: 'BL-GEOPLANT-001', name: 'Geometric Planter Trio',
    shortDescription: 'Three coordinated small planters for succulents and desk plants.',
    description: 'Choose a color for the coordinated three-planter set.',
    category: 'Plants & Decor', productType: 'made_to_order', amountCents: 3299, material: 'PETG', colors, leadTime: [5, 6],
    personalization: [],
  },
  {
    id: 'PD-04', slug: 'hanging-air-plant-holder', sku: 'BL-AIRPLANT-001', name: 'Hanging Air-Plant Holder',
    shortDescription: 'A light sculptural cradle designed for small air plants.',
    description: 'Choose a color for this hanging air-plant cradle.',
    category: 'Plants & Decor', productType: 'made_to_order', amountCents: 1699, material: 'PETG', colors, leadTime: [2, 3],
    personalization: [],
  },
  {
    id: 'GH-01', slug: 'modular-tabletop-token-trays', sku: 'BL-TOKENTRAY-001', name: 'Modular Tabletop Token Trays',
    shortDescription: 'Stackable trays keep shared tokens visible and the table moving.',
    description: 'Choose a color for this stackable token tray set.',
    category: 'Gaming & Hobbies', productType: 'made_to_order', amountCents: 1899, material: 'PLA', colors, leadTime: [3, 4],
    personalization: [],
  },
  {
    id: 'GH-05', slug: 'trading-card-display-stands', sku: 'BL-CARDSTAND-001', name: 'Trading-Card Display Stands',
    shortDescription: 'Low-profile stands that frame favorite cards without covering them.',
    description: 'Choose a color for this set of three card display stands.',
    category: 'Gaming & Hobbies', productType: 'made_to_order', amountCents: 1499, material: 'PLA', colors, leadTime: [2, 3],
    personalization: [],
  },
  {
    id: 'GH-06', slug: 'universal-board-game-organizer', sku: 'BL-BOARDORG-001', name: 'Universal Board-Game Organizer',
    shortDescription: 'Configurable trays for cards, cubes, coins, and common components.',
    description: 'Choose a color for this configurable board-game organizer.',
    category: 'Gaming & Hobbies', productType: 'made_to_order', amountCents: 2999, material: 'PLA', colors, leadTime: [5, 6],
    personalization: [],
  },
  {
    id: 'SE-01', slug: 'holiday-ornament', sku: 'BL-ORNAMENT-001', name: 'Personalized Holiday Ornament',
    shortDescription: 'A name-and-year keepsake with a choice of modern motifs.',
    description: 'Enter a name and optional year for this holiday ornament.',
    category: 'Seasonal', productType: 'personalized', amountCents: 1499, material: 'PLA', colors: giftColors, leadTime: [2, 3],
    personalization: [field('name', 'Name', 'text', true, { maxLength: 24 }), field('year', 'Year', 'text', false, { maxLength: 4 })],
  },
  {
    id: 'SE-06', slug: 'valentine-coordinates-keepsake', sku: 'BL-VALCOORD-001', name: 'Valentine Coordinates Keepsake',
    shortDescription: 'A minimal reminder of where your story began.',
    description: 'Enter coordinates and an optional date for this keepsake.',
    category: 'Seasonal', productType: 'personalized', amountCents: 1999, material: 'PLA', colors: giftColors, leadTime: [3, 4],
    personalization: [field('coordinates', 'Coordinates', 'text', true, { maxLength: 60 }), field('date', 'Date', 'text', false, { maxLength: 30 })],
  },
  {
    id: 'SE-07', slug: 'family-photo-lithophane', sku: 'BL-FAMLITHO-001', name: 'Family Photo Lithophane',
    shortDescription: 'A framed glowing photo gift for any occasion.',
    description: 'Upload a photo, choose its orientation and add an optional caption. We review the image before production.',
    category: 'Seasonal', productType: 'personalized', amountCents: 3499, material: 'PLA', colors: giftColors, leadTime: [4, 6],
    personalization: [field('photo', 'Photo', 'file', true), field('orientation', 'Orientation', 'select', true, { options: ['Portrait', 'Landscape'] }), field('caption', 'Caption', 'text', false, { maxLength: 60 })],
  },
  {
    id: 'BE-02', slug: 'table-number-set', sku: 'BL-TABLENUM-001', name: 'Table Number Set',
    shortDescription: 'A coordinated set of modern, highly legible table numbers 1 through 10.',
    description: 'Add an optional numbering note before production.',
    category: 'Business & Events', productType: 'personalized', amountCents: 4999, material: 'PLA', colors: giftColors, leadTime: [5, 7],
    personalization: [field('note', 'Numbering note', 'text', false, { maxLength: 120 })],
  },
  {
    id: 'BE-05', slug: 'branded-bag-tags', sku: 'BL-BIZBAGTAG-001', name: 'Branded Bag Tags',
    shortDescription: 'Durable branded tags for teams, events, or customer gifts.',
    description: 'Enter the tag text and an optional approved logo for review before production.',
    category: 'Business & Events', productType: 'personalized', amountCents: 9900, material: 'PETG', colors, leadTime: [8, 10],
    personalization: [field('text', 'Tag text', 'text', true, { maxLength: 24 }), field('logo', 'Approved logo', 'file', false)],
  },
];

export const fallbackProducts: Product[] = launch.map((product) => ({
  id: product.id,
  slug: product.slug,
  sku: product.sku,
  name: product.name,
  shortDescription: product.shortDescription,
  description: product.description,
  category: product.category,
  productType: product.productType,
  price: { amountCents: product.amountCents, currency: 'USD' },
  material: product.material,
  materials: product.material.split(/\s*[/+]\s*/).filter(Boolean),
  colors: product.colors,
  leadTimeDays: { min: product.leadTime[0], max: product.leadTime[1] },
  featured: true,
  badge: product.minimumQuantity ? `Min. ${product.minimumQuantity}` : product.productType === 'personalized' ? 'Personalize' : 'Launch',
  personalization: product.personalization,
  includedItems: ['Selected printed product or service', 'Human review before production', 'Care information where applicable'],
  careInstructions: ['Follow the included product-specific care guidance.'],
  safetyWarnings: product.safety ? [product.safety] : ['This is not a safety-critical product.'],
  minimumQuantity: product.minimumQuantity ?? 1,
}));

export const categories: ProductCategory[] = ['Gifts & Personalization', 'Plants & Decor', 'Gaming & Hobbies', 'Seasonal', 'Business & Events', 'Custom 3D Print'];
export const featuredProducts = fallbackProducts;
export const productBySlug = (slug: string) => fallbackProducts.find((product) => product.slug === slug);
