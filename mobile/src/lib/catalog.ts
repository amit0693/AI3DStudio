import type { Product, ProductCategory } from './types';

type Seed = [string, string, string, number, string, string?];

const details: Record<ProductCategory, { material: string; description: string; colors: string[]; care: string[] }> = {
  'Gifts & Personalization': {
    material: 'PLA',
    description: 'Made one at a time from your details, then checked by a person before production.',
    colors: ['Forest', 'Terracotta', 'Cream', 'Ocean', 'Black'],
    care: ['Dust with a soft, dry cloth.', 'Keep PLA away from high heat and direct sun.'],
  },
  'Desk & Tech': {
    material: 'PLA / PETG',
    description: 'A practical, made-to-order upgrade designed to keep everyday gear organized.',
    colors: ['Forest', 'Slate', 'Cream', 'Terracotta'],
    care: ['Wipe clean with a damp cloth.', 'Do not place near a heat source.'],
  },
  'Home & Organization': {
    material: 'PETG',
    description: 'Small-space organization with a durable printed form and repairable, modular parts.',
    colors: ['Cream', 'Forest', 'Slate', 'Terracotta'],
    care: ['Hand wash only.', 'Follow the included mounting and load guidance.'],
  },
  'Plants & Decor': {
    material: 'PETG',
    description: 'A sculptural home accent printed in small batches with practical care in mind.',
    colors: ['Sage', 'Terracotta', 'Cream', 'Forest'],
    care: ['Hand wash only.', 'Use the included insert or reservoir where provided.'],
  },
  'Gaming & Hobbies': {
    material: 'PLA',
    description: 'Modular storage and tabletop tools designed for generic hobby components.',
    colors: ['Forest', 'Terracotta', 'Slate', 'Cream'],
    care: ['Wipe clean with a dry cloth.', 'For hobby use; not intended for children under 14.'],
  },
  Seasonal: {
    material: 'PLA',
    description: 'A made-to-order seasonal accent that is easy to give and easy to display.',
    colors: ['Cream', 'Forest', 'Terracotta', 'Gold'],
    care: ['Store indoors in a cool, dry place.', 'Use flameless LEDs only where applicable.'],
  },
  'Business & Events': {
    material: 'PLA / PETG',
    description: 'A polished small-batch display made for events, counters, and customer touchpoints.',
    colors: ['Brand match', 'Forest', 'Cream', 'Black'],
    care: ['Wipe clean with a soft cloth.', 'Confirm logo rights before submitting artwork.'],
  },
};

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function buildCategory(category: ProductCategory, seeds: Seed[]): Product[] {
  const meta = details[category];
  return seeds.map(([sku, name, shortDescription, amountCents, material, badge], index) => ({
    id: sku,
    slug: slugify(name),
    sku,
    name,
    shortDescription,
    description: `${shortDescription} ${meta.description}`,
    category,
    productType: badge === 'Personalize' ? 'personalized' : 'made_to_order',
    price: { amountCents, currency: 'USD' },
    material,
    materials: material.split(' / '),
    colors: meta.colors,
    leadTimeDays: { min: category === 'Business & Events' ? 4 : 2, max: category === 'Business & Events' ? 8 : 5 },
    printTimeHours: { min: Math.max(1, Math.round(amountCents / 900)), max: Math.max(2, Math.round(amountCents / 500)) },
    dimensions: 'Made to fit the product shown; exact dimensions are listed before checkout.',
    featured: badge === 'Best Seller' || badge === 'Personalize' || index === 0,
    badge: (badge as Product['badge']) ?? (index === 0 ? 'Best Seller' : undefined),
    personalization: badge === 'Personalize' ? ['text', 'notes'] : undefined,
    includedItems: ['Selected printed product', 'Care card', 'Recyclable protective packaging'],
    careInstructions: meta.care,
    safetyWarnings: [
      material.includes('PLA') ? 'PLA can soften in high heat; do not leave in a hot vehicle.' : 'Not dishwasher safe.',
      category === 'Gaming & Hobbies' ? 'Contains small parts; intended for ages 14+.' : 'This is not a safety-critical product.',
    ],
  }));
}

export const categories: ProductCategory[] = [
  'Gifts & Personalization', 'Desk & Tech', 'Home & Organization', 'Plants & Decor',
  'Gaming & Hobbies', 'Seasonal', 'Business & Events',
];

export const fallbackProducts: Product[] = [
  ...buildCategory('Gifts & Personalization', [
    ['PG-01', 'Photo Lithophane Night Light', 'Turn a favorite photo into a softly glowing keepsake.', 2999, 'PLA', 'Personalize'],
    ['PG-02', 'Four-Photo Lithophane Cube Lamp', 'Four memories become one warm, dimensional lamp.', 4999, 'PLA', 'Personalize'],
    ['PG-03', 'Custom Name Desk Sign', 'Raised lettering in your choice of name and color.', 2499, 'PLA', 'Personalize'],
    ['PG-04', 'Personalized Name Bag Tag', 'A durable, easy-to-spot tag for bags and gear.', 799, 'PLA', 'Personalize'],
    ['PG-05', 'Pet Memorial Silhouette Stand', 'A quiet silhouette keepsake made from your pet photo.', 2999, 'PLA', 'Personalize'],
    ['PG-06', 'Coordinates & Date Keepsake', 'Mark a meaningful place and date in dimensional type.', 1999, 'PLA', 'Personalize'],
    ['PG-07', 'Custom QR Display Sign', 'A scan-ready sign for a link, playlist, or message.', 2299, 'PLA', 'Personalize'],
    ['PG-08', 'Personalized Ornament', 'A light, gift-ready ornament with custom lettering.', 1499, 'PLA', 'Personalize'],
  ]),
  ...buildCategory('Desk & Tech', [
    ['DT-01', 'Modular Phone & Accessory Desk Dock', 'Build a tidy landing spot for your daily carry.', 3499, 'PLA / PETG', 'Best Seller'],
    ['DT-02', 'Headphone Stand', 'A stable sculptural perch for full-size headphones.', 2999, 'PLA / PETG'],
    ['DT-03', 'Universal Game Controller Stand', 'Display one controller without branded shapes or logos.', 2499, 'PLA'],
    ['DT-04', 'Six-Piece Cable Management Kit', 'Keep charging and display cables right where you need them.', 1299, 'PETG', 'Bundle'],
    ['DT-05', 'Adjustable Vertical Laptop Stand', 'A padded, space-saving stand that adjusts to your laptop.', 2499, 'PETG'],
    ['DT-06', 'Pen, Notes & Phone Organizer', 'Three desk essentials, one compact footprint.', 2299, 'PLA'],
    ['DT-07', 'Modular Pegboard Starter Kit', 'Start a flexible wall system with useful everyday holders.', 1999, 'PETG', 'Bundle'],
    ['DT-08', 'Under-Desk Headphone Hook', 'Put headphones within reach and off the work surface.', 1499, 'PETG'],
    ['DT-09', 'Tablet & E-Reader Stand', 'A comfortable viewing angle for reading or calls.', 1999, 'PLA'],
    ['DT-10', 'Webcam & Small-Light Riser', 'Lift compact creator gear to a more useful height.', 1799, 'PETG'],
  ]),
  ...buildCategory('Home & Organization', [
    ['HO-01', 'Entryway Key & Wallet Station', 'Give keys, cards, and a wallet one welcoming home.', 2999, 'PETG', 'Best Seller'],
    ['HO-02', 'Modular Drawer Bin Starter Set', 'Four bins that combine into a cleaner drawer layout.', 2499, 'PLA', 'Bundle'],
    ['HO-03', 'Wall-Mounted Remote Holder', 'Keep remotes visible, upright, and easy to return.', 1499, 'PETG'],
    ['HO-04', 'Battery Storage & Dispensing Rack', 'Sort common household batteries and see what is left.', 2499, 'PETG'],
    ['HO-05', 'Makeup & Skincare Organizer', 'A calm countertop organizer for daily essentials.', 2799, 'PLA'],
    ['HO-06', 'Reusable Storage Label Clips', 'A set of twelve removable clips for bins and baskets.', 1299, 'PETG', 'Bundle'],
    ['HO-07', 'Under-Shelf Hook Set', 'Add four useful hanging points without taking shelf space.', 1499, 'PETG', 'Bundle'],
    ['HO-08', 'Mail & Key Wall Organizer', 'Collect incoming mail and everyday keys in one place.', 3499, 'PETG'],
    ['HO-09', 'Toothbrush & Bathroom Organizer', 'Separate wet daily items in an easy-clean caddy.', 1999, 'PETG'],
    ['HO-10', 'Stackable Small-Parts Bins', 'Four modular bins for hardware, craft, or office supplies.', 2499, 'PETG', 'Bundle'],
  ]),
  ...buildCategory('Plants & Decor', [
    ['PD-01', 'Self-Watering Planter', 'A sculptural two-part planter with a simple water reservoir.', 2499, 'PETG', 'Best Seller'],
    ['PD-02', 'Propagation Station with Glass Tubes', 'A compact stand for rooting three plant cuttings.', 2999, 'PETG'],
    ['PD-03', 'Geometric Planter Trio', 'Three coordinated planters sized for small plants.', 3299, 'PETG', 'Bundle'],
    ['PD-04', 'Hanging Air-Plant Holder', 'A light geometric frame for a small air plant.', 1699, 'PETG'],
    ['PD-05', 'Decorative Vase with Glass Insert', 'Printed texture outside, removable watertight glass inside.', 2999, 'PLA / PETG'],
    ['PD-06', 'Corner Doorway Silhouette', 'A playful architectural accent for a door frame or shelf.', 1899, 'PLA'],
    ['PD-07', 'Modular Plant Trellis Set', 'Three connectable supports that grow with your plant.', 1999, 'PETG', 'Bundle'],
    ['PD-08', 'Window-Sill Herb Planter', 'A compact trough made for a bright kitchen sill.', 3499, 'PETG'],
  ]),
  ...buildCategory('Gaming & Hobbies', [
    ['GH-01', 'Modular Tabletop Token Trays', 'Connectable trays keep generic game pieces sorted.', 1899, 'PLA', 'Bundle'],
    ['GH-02', 'Adjustable Card Deck Box', 'A sliding divider keeps different deck sizes secure.', 2499, 'PLA'],
    ['GH-03', 'Dice Tower & Folding Tray', 'A compact tower that packs into its own rolling tray.', 2999, 'PLA'],
    ['GH-04', 'Hobby Paint-Bottle Rack', 'Tiered storage keeps paint colors visible and reachable.', 3499, 'PLA', 'Best Seller'],
    ['GH-05', 'Trading-Card Display Stands', 'Three understated stands for favorite cards or small art.', 1499, 'PLA', 'Bundle'],
    ['GH-06', 'Universal Board-Game Organizer', 'Modular bins for cards, tokens, and generic components.', 2999, 'PLA'],
    ['GH-07', 'Miniature Painting Tool Caddy', 'Organize brushes, files, cutters, and work-in-progress pieces.', 2799, 'PLA'],
    ['GH-08', 'Modular Dice & Token Storage Box', 'A compact customizable box for tabletop essentials.', 2499, 'PLA'],
  ]),
  ...buildCategory('Seasonal', [
    ['SE-01', 'Personalized Holiday Ornament', 'Add a name and year to a gift-ready ornament.', 1499, 'PLA', 'Personalize'],
    ['SE-02', 'LED Tealight Decorative Lantern', 'A patterned lantern designed only for flameless LED lights.', 2499, 'PLA', 'New'],
    ['SE-03', 'Graduation Name & Year Sign', 'Celebrate a graduate with dimensional custom lettering.', 2299, 'PLA', 'Personalize'],
    ['SE-04', 'Teacher Name Desk Sign', 'A colorful custom sign for a classroom or office.', 2299, 'PLA', 'Personalize'],
    ['SE-05', 'Halloween LED Window Silhouette', 'A lightweight silhouette made for flameless backlighting.', 1999, 'PLA'],
    ['SE-06', 'Valentine Coordinates Keepsake', 'Mark where your story began with a place and date.', 1999, 'PLA', 'Personalize'],
    ['SE-07', 'Mother’s or Father’s Day Lithophane', 'A photo keepsake prepared for a meaningful family gift.', 3499, 'PLA', 'Personalize'],
    ['SE-08', 'Custom Stocking Name Tag', 'A dimensional tag that makes stockings easy to spot.', 999, 'PLA', 'Personalize'],
  ]),
  ...buildCategory('Business & Events', [
    ['BE-01', 'Wedding Place Name', 'Individual dimensional names for polished place settings.', 399, 'PLA', 'Personalize'],
    ['BE-02', 'Table Number Set 1–10', 'Ten coordinated numbers for weddings and events.', 4999, 'PLA', 'Bundle'],
    ['BE-03', 'QR Review or Payment Sign', 'A branded, scan-ready counter sign for your link.', 2499, 'PLA', 'Personalize'],
    ['BE-04', 'Logo Counter Sign', 'A dimensional tabletop logo prepared from approved artwork.', 3999, 'PLA', 'Personalize'],
    ['BE-05', 'Branded Bag Tags — Set of 25', 'Small-batch custom tags for teams and events.', 9900, 'PETG', 'Bundle'],
    ['BE-06', 'Custom Product Display Stand', 'A tailored riser or holder for a small retail product.', 3500, 'PETG', 'Personalize'],
    ['BE-07', 'Event Favor Tags — Set of 20', 'Coordinated custom tags for guest favors.', 4999, 'PLA', 'Bundle'],
    ['BE-08', 'Retail Price-Card Holder Set', 'A clean set of holders for shelves and counters.', 2499, 'PETG', 'Bundle'],
  ]),
].map((product) => {
  if (product.id === 'PG-01') return { ...product, personalization: ['photo', 'text', 'notes'] };
  if (product.id === 'PG-02' || product.id === 'PG-05' || product.id === 'SE-07') return { ...product, personalization: ['photo', 'text', 'notes'] };
  if (product.id === 'PG-06' || product.id === 'SE-06') return { ...product, personalization: ['coordinates', 'date', 'text', 'notes'] };
  if (['PG-07', 'BE-03', 'BE-04', 'BE-05', 'BE-06'].includes(product.id)) return { ...product, personalization: ['logo', 'text', 'notes'] };
  if (product.id === 'BE-01') return { ...product, minimumQuantity: 10 };
  return product;
});

export const featuredProducts = fallbackProducts.filter((product) =>
  ['PG-01', 'DT-01', 'PD-01', 'PG-03', 'HO-01', 'DT-07', 'PG-05', 'GH-04'].includes(product.id),
);

export const productBySlug = (slug: string) => fallbackProducts.find((product) => product.slug === slug);
