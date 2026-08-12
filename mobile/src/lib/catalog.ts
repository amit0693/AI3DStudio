import type { Product } from './types';

export const fallbackProducts: Product[] = [
  {
    id: 'prod_desk_name', slug: 'personalized-desk-name-sign', sku: 'BL-NAME-001',
    name: 'Personalized Desk Name Sign', shortDescription: 'A clean two-color nameplate for desks, studios, and gifts.',
    description: 'Choose the name and color pairing for a locally printed desk sign with crisp raised lettering.',
    category: 'Personalized gifts', productType: 'personalized', price: { amountCents: 2499, compareAtAmountCents: 2999, currency: 'USD' },
    material: 'PLA', leadTimeDays: { min: 2, max: 4 }, featured: true,
  },
  {
    id: 'prod_qr_stand', slug: 'custom-qr-code-counter-stand', sku: 'BL-QR-001',
    name: 'Custom QR Counter Stand', shortDescription: 'A branded scan-ready counter sign for menus, reviews, or payments.',
    description: 'Send your destination URL and colors. We create a durable, easy-to-scan stand for your counter.',
    category: 'For business', productType: 'personalized', price: { amountCents: 3499, currency: 'USD' },
    material: 'PLA', leadTimeDays: { min: 3, max: 5 }, featured: true,
  },
  {
    id: 'prod_lithophane', slug: 'photo-lithophane-panel', sku: 'BL-LITHO-001',
    name: 'Custom Photo Lithophane', shortDescription: 'Turn a favorite photo into a dimensional light-catching keepsake.',
    description: 'Your photo becomes a detailed relief panel that reveals the image near a light source.',
    category: 'Personalized gifts', productType: 'personalized', price: { amountCents: 3999, compareAtAmountCents: 4499, currency: 'USD' },
    material: 'PLA', leadTimeDays: { min: 3, max: 6 }, featured: true,
  },
  {
    id: 'prod_cable_kit', slug: 'desk-cable-management-kit', sku: 'BL-CABLE-001',
    name: 'Desk Cable Management Kit', shortDescription: 'Six low-profile clips that keep charging and monitor cables in reach.',
    description: 'A practical set of reusable cable guides sized for common charging, USB, and display cables.',
    category: 'Desk accessories', productType: 'made_to_order', price: { amountCents: 1699, currency: 'USD' },
    material: 'PETG', leadTimeDays: { min: 2, max: 4 }, featured: false,
  },
];
