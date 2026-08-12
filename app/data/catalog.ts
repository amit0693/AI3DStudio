export const COLLECTIONS = [
  "Best Sellers",
  "Gifts & Personalization",
  "Desk & Tech",
  "Home & Organization",
  "Plants & Decor",
  "Gaming & Hobbies",
  "Seasonal",
  "Business & Events",
  "Custom 3D Print",
] as const;

export type Collection = (typeof COLLECTIONS)[number];

export type Product = {
  id: string;
  slug: string;
  name: string;
  collection: Exclude<Collection, "Best Sellers">;
  price: number;
  description: string;
  material: string;
  colors: string[];
  productionDays: number;
  personalized?: boolean;
  featured?: boolean;
  badge?: string;
  minimum?: number;
  safety?: string;
};

const colors = ["Forest", "Cream", "Terracotta", "Ocean", "Charcoal"];
const giftColors = ["Cream", "Forest", "Rose", "Ocean", "Charcoal"];

export const PRODUCTS: Product[] = [
  { id:"PG-01", slug:"custom-photo-lithophane-night-light", name:"Photo Lithophane Night Light", collection:"Gifts & Personalization", price:29.99, description:"Turn a favorite photo into a softly glowing, made-for-you keepsake.", material:"PLA", colors:giftColors, productionDays:5, personalized:true, featured:true, badge:"Best seller", safety:"Use only with the included low-heat LED light." },
  { id:"PG-02", slug:"four-photo-lithophane-cube-lamp", name:"Four-Photo Lithophane Cube Lamp", collection:"Gifts & Personalization", price:49.99, description:"Four memories in one sculptural light, with a preview before printing.", material:"PLA", colors:giftColors, productionDays:7, personalized:true, badge:"Personalize" },
  { id:"PG-03", slug:"custom-name-desk-sign", name:"Custom Name Desk Sign", collection:"Gifts & Personalization", price:24.99, description:"A layered nameplate sized, colored, and lettered for their space.", material:"PLA", colors:giftColors, productionDays:4, personalized:true, featured:true, badge:"Best seller" },
  { id:"PG-04", slug:"personalized-name-bag-tag", name:"Personalized Name Bag Tag", collection:"Gifts & Personalization", price:7.99, description:"A durable two-color tag for backpacks, luggage, and everyday carry.", material:"PETG", colors:giftColors, productionDays:3, personalized:true, badge:"3 for $17.99" },
  { id:"PG-05", slug:"pet-memorial-silhouette-stand", name:"Pet Memorial Silhouette Stand", collection:"Gifts & Personalization", price:29.99, description:"A quiet custom silhouette keepsake made from your favorite pet photo.", material:"PLA", colors:giftColors, productionDays:5, personalized:true, featured:true, badge:"Personalize" },
  { id:"PG-06", slug:"coordinates-date-keepsake", name:"Coordinates & Date Keepsake", collection:"Gifts & Personalization", price:19.99, description:"Mark a meaningful place and date in a minimal tabletop piece.", material:"PLA", colors:giftColors, productionDays:4, personalized:true },
  { id:"PG-07", slug:"custom-qr-display-sign", name:"Custom QR Display Sign", collection:"Gifts & Personalization", price:22.99, description:"A scan-ready stand for a playlist, album, registry, or personal link.", material:"PLA", colors:giftColors, productionDays:4, personalized:true },
  { id:"PG-08", slug:"personalized-ornament", name:"Personalized Ornament", collection:"Gifts & Personalization", price:14.99, description:"A lightweight name-and-year ornament with gift-ready packaging.", material:"PLA", colors:giftColors, productionDays:3, personalized:true },

  { id:"DT-01", slug:"modular-phone-accessory-desk-dock", name:"Modular Phone & Accessory Desk Dock", collection:"Desk & Tech", price:34.99, description:"A configurable home for your phone, watch cable, pen, and daily carry.", material:"PLA + TPU", colors, productionDays:5, featured:true, badge:"Best seller" },
  { id:"DT-02", slug:"headphone-stand", name:"Headphone Stand", collection:"Desk & Tech", price:29.99, description:"A stable, cable-friendly stand with a soft resting curve.", material:"PETG", colors, productionDays:4 },
  { id:"DT-03", slug:"universal-controller-stand", name:"Universal Controller Stand", collection:"Desk & Tech", price:24.99, description:"Display most modern controllers without hiding their best angles.", material:"PLA", colors, productionDays:4 },
  { id:"DT-04", slug:"six-piece-cable-management-kit", name:"6-Piece Cable Management Kit", collection:"Desk & Tech", price:12.99, description:"Low-profile flexible clips keep charging and display cables within reach.", material:"PETG + TPU", colors, productionDays:3, featured:true, badge:"Under $20" },
  { id:"DT-05", slug:"adjustable-vertical-laptop-stand", name:"Adjustable Vertical Laptop Stand", collection:"Desk & Tech", price:24.99, description:"An adjustable space-saver with non-slip pads for closed laptops.", material:"PETG + TPU", colors, productionDays:4 },
  { id:"DT-06", slug:"pen-notes-phone-organizer", name:"Pen, Notes & Phone Organizer", collection:"Desk & Tech", price:22.99, description:"One compact landing zone for the small things that clutter a desk.", material:"PLA", colors, productionDays:4, featured:true },
  { id:"DT-07", slug:"modular-pegboard-starter-kit", name:"Modular Pegboard Starter Kit", collection:"Desk & Tech", price:19.99, description:"A five-piece starter set that grows with your workspace.", material:"PETG", colors, productionDays:4, featured:true, badge:"Expandable" },
  { id:"DT-08", slug:"under-desk-headphone-hook", name:"Under-Desk Headphone Hook", collection:"Desk & Tech", price:14.99, description:"A strong, rounded hook that puts headphones out of the way.", material:"PETG", colors, productionDays:3, safety:"Fastener and mounting surface determine maximum load." },
  { id:"DT-09", slug:"tablet-ereader-stand", name:"Tablet & E-Reader Stand", collection:"Desk & Tech", price:19.99, description:"A reading-friendly stand with charging access in either orientation.", material:"PLA", colors, productionDays:3 },
  { id:"DT-10", slug:"webcam-small-light-riser", name:"Webcam & Small-Light Riser", collection:"Desk & Tech", price:17.99, description:"Lift compact camera gear to a more flattering, useful height.", material:"PETG", colors, productionDays:3 },

  { id:"HO-01", slug:"entryway-key-wallet-station", name:"Entryway Key & Wallet Station", collection:"Home & Organization", price:29.99, description:"A simple wall-mounted landing zone for keys, wallet, and mail.", material:"PETG", colors, productionDays:5, featured:true, safety:"Fastener and mounting surface determine maximum load." },
  { id:"HO-02", slug:"modular-drawer-bin-set", name:"Modular Drawer Bin Starter Set", collection:"Home & Organization", price:24.99, description:"Mix-and-match bins that turn a messy drawer into a useful system.", material:"PLA", colors, productionDays:5 },
  { id:"HO-03", slug:"wall-mounted-remote-holder", name:"Wall-Mounted Remote Holder", collection:"Home & Organization", price:14.99, description:"Keep two remotes visible and within easy reach.", material:"PETG", colors, productionDays:3, featured:true },
  { id:"HO-04", slug:"battery-storage-rack", name:"Battery Storage & Dispensing Rack", collection:"Home & Organization", price:24.99, description:"See what you have and pull the next AA or AAA from the bottom.", material:"PETG", colors, productionDays:5 },
  { id:"HO-05", slug:"makeup-skincare-organizer", name:"Makeup & Skincare Organizer", collection:"Home & Organization", price:27.99, description:"Tiered compartments make daily products easier to see and reach.", material:"PLA", colors, productionDays:5 },
  { id:"HO-06", slug:"storage-label-clips", name:"Storage Label Clips · Set of 12", collection:"Home & Organization", price:12.99, description:"Reusable write-on clips for bins, baskets, shelves, and pantry zones.", material:"PETG", colors, productionDays:3 },
  { id:"HO-07", slug:"under-shelf-hook-set", name:"Under-Shelf Hook Set", collection:"Home & Organization", price:14.99, description:"Add four removable hanging points beneath a shelf.", material:"PETG", colors, productionDays:3, safety:"For lightweight household items only." },
  { id:"HO-08", slug:"mail-key-wall-organizer", name:"Mail & Key Wall Organizer", collection:"Home & Organization", price:34.99, description:"A wider entryway organizer for incoming mail and up to five key sets.", material:"PETG", colors, productionDays:6 },
  { id:"HO-09", slug:"bathroom-organizer", name:"Toothbrush & Bathroom Organizer", collection:"Home & Organization", price:19.99, description:"A ventilated, easy-rinse organizer sized for a busy counter.", material:"PETG", colors, productionDays:4 },
  { id:"HO-10", slug:"stackable-small-parts-bins", name:"Stackable Small-Parts Bins · Set of 4", collection:"Home & Organization", price:24.99, description:"Open-front bins for hardware, craft supplies, and workshop essentials.", material:"PETG", colors, productionDays:5 },

  { id:"PD-01", slug:"self-watering-planter", name:"Self-Watering Planter", collection:"Plants & Decor", price:24.99, description:"A two-piece planter that makes moisture levels easy to check.", material:"PETG", colors, productionDays:5, featured:true, badge:"Plant favorite" },
  { id:"PD-02", slug:"propagation-station", name:"Propagation Station with Glass Tubes", collection:"Plants & Decor", price:29.99, description:"A stable three-tube stand for watching new roots take shape.", material:"PETG + glass", colors, productionDays:5 },
  { id:"PD-03", slug:"geometric-planter-trio", name:"Geometric Planter Trio", collection:"Plants & Decor", price:32.99, description:"Three coordinated small planters for succulents and desk plants.", material:"PETG", colors, productionDays:6 },
  { id:"PD-04", slug:"hanging-air-plant-holder", name:"Hanging Air-Plant Holder", collection:"Plants & Decor", price:16.99, description:"A light sculptural cradle designed for small air plants.", material:"PETG", colors, productionDays:3 },
  { id:"PD-05", slug:"decorative-vase-glass-insert", name:"Decorative Vase with Glass Insert", collection:"Plants & Decor", price:29.99, description:"A ribbed printed shell around a removable watertight glass insert.", material:"PLA + glass", colors, productionDays:5 },
  { id:"PD-06", slug:"doorway-silhouette-decoration", name:"Corner Doorway Silhouette", collection:"Plants & Decor", price:18.99, description:"A playful architectural accent that peeks around a doorframe.", material:"PLA", colors, productionDays:3 },
  { id:"PD-07", slug:"modular-plant-trellis-set", name:"Modular Plant Trellis Set", collection:"Plants & Decor", price:19.99, description:"Connectable supports that adapt as climbing houseplants grow.", material:"PETG", colors, productionDays:4 },
  { id:"PD-08", slug:"window-sill-herb-planter", name:"Window-Sill Herb Planter", collection:"Plants & Decor", price:34.99, description:"A long, narrow planter sized for sunny ledges and compact herbs.", material:"PETG", colors, productionDays:6 },

  { id:"GH-01", slug:"modular-tabletop-token-trays", name:"Modular Tabletop Token Trays", collection:"Gaming & Hobbies", price:18.99, description:"Stackable trays keep shared tokens visible and the table moving.", material:"PLA", colors, productionDays:4, featured:true },
  { id:"GH-02", slug:"adjustable-card-deck-box", name:"Adjustable Card Deck Box", collection:"Gaming & Hobbies", price:24.99, description:"An adjustable divider keeps sleeved card collections snug.", material:"PLA", colors, productionDays:5 },
  { id:"GH-03", slug:"dice-tower-folding-tray", name:"Dice Tower & Folding Tray", collection:"Gaming & Hobbies", price:29.99, description:"A satisfying tower that packs into its own quiet rolling tray.", material:"PLA", colors, productionDays:6 },
  { id:"GH-04", slug:"hobby-paint-bottle-rack", name:"Hobby Paint-Bottle Rack", collection:"Gaming & Hobbies", price:34.99, description:"Tiered storage puts up to 24 common hobby paints in clear view.", material:"PLA", colors, productionDays:6, featured:true, badge:"Maker pick" },
  { id:"GH-05", slug:"trading-card-display-stands", name:"Trading-Card Display Stands · Set of 3", collection:"Gaming & Hobbies", price:14.99, description:"Low-profile stands that frame favorite cards without covering them.", material:"PLA", colors, productionDays:3 },
  { id:"GH-06", slug:"universal-board-game-organizer", name:"Universal Board-Game Organizer", collection:"Gaming & Hobbies", price:29.99, description:"Configurable trays for cards, cubes, coins, and common components.", material:"PLA", colors, productionDays:6 },
  { id:"GH-07", slug:"miniature-painting-tool-caddy", name:"Miniature Painting Tool Caddy", collection:"Gaming & Hobbies", price:27.99, description:"Organize brushes, tools, water cups, and the miniature in progress.", material:"PLA", colors, productionDays:5 },
  { id:"GH-08", slug:"modular-dice-token-box", name:"Modular Dice & Token Storage Box", collection:"Gaming & Hobbies", price:24.99, description:"A compact click-shut box with movable dividers.", material:"PLA", colors, productionDays:5 },

  { id:"SE-01", slug:"holiday-ornament", name:"Personalized Holiday Ornament", collection:"Seasonal", price:14.99, description:"A name-and-year keepsake with a choice of modern motifs.", material:"PLA", colors:giftColors, productionDays:3, personalized:true },
  { id:"SE-02", slug:"led-tealight-lantern", name:"LED Tealight Decorative Lantern", collection:"Seasonal", price:24.99, description:"A patterned lantern made only for flameless LED tealights.", material:"PETG", colors, productionDays:5, safety:"Flameless LED lights only. Never use an open flame." },
  { id:"SE-03", slug:"graduation-name-year-sign", name:"Graduation Name & Year Sign", collection:"Seasonal", price:22.99, description:"A personalized celebration sign for a party table or photo setup.", material:"PLA", colors:giftColors, productionDays:4, personalized:true },
  { id:"SE-04", slug:"teacher-name-desk-sign", name:"Teacher Name Desk Sign", collection:"Seasonal", price:22.99, description:"A classroom-ready personalized sign with a sturdy base.", material:"PLA", colors:giftColors, productionDays:4, personalized:true },
  { id:"SE-05", slug:"halloween-led-window-silhouette", name:"Halloween LED Window Silhouette", collection:"Seasonal", price:19.99, description:"A dramatic window accent designed for low-heat LEDs.", material:"PETG", colors, productionDays:4, safety:"Use only with low-heat LED lighting." },
  { id:"SE-06", slug:"valentine-coordinates-keepsake", name:"Valentine Coordinates Keepsake", collection:"Seasonal", price:19.99, description:"A minimal reminder of where your story began.", material:"PLA", colors:giftColors, productionDays:4, personalized:true },
  { id:"SE-07", slug:"family-photo-lithophane", name:"Family Photo Lithophane", collection:"Seasonal", price:34.99, description:"A framed glowing photo gift for Mother’s Day, Father’s Day, or anytime.", material:"PLA", colors:giftColors, productionDays:6, personalized:true },
  { id:"SE-08", slug:"stocking-name-tag", name:"Custom Stocking Name Tag", collection:"Seasonal", price:9.99, description:"A two-color name tag that makes every stocking easy to spot.", material:"PLA", colors:giftColors, productionDays:3, personalized:true },

  { id:"BE-01", slug:"wedding-place-name", name:"Wedding Place Name", collection:"Business & Events", price:3.99, description:"Freestanding guest names that double as personal favors.", material:"PLA", colors:giftColors, productionDays:7, personalized:true, featured:true, badge:"Min. 10", minimum:10 },
  { id:"BE-02", slug:"table-number-set", name:"Table Number Set · 1–10", collection:"Business & Events", price:49.99, description:"A coordinated set of modern, highly legible table numbers.", material:"PLA", colors:giftColors, productionDays:7, personalized:true },
  { id:"BE-03", slug:"qr-review-payment-sign", name:"QR Review or Payment Sign", collection:"Business & Events", price:24.99, description:"A branded counter sign configured and test-scanned before delivery.", material:"PLA", colors, productionDays:5, personalized:true },
  { id:"BE-04", slug:"logo-counter-sign", name:"Logo Counter Sign", collection:"Business & Events", price:39.99, description:"A dimensional logo sign tailored to your counter and brand colors.", material:"PLA", colors, productionDays:7, personalized:true, badge:"From $39.99" },
  { id:"BE-05", slug:"branded-bag-tags", name:"Branded Bag Tags · Set of 25", collection:"Business & Events", price:99, description:"Durable branded tags for teams, events, or customer gifts.", material:"PETG", colors, productionDays:10, personalized:true },
  { id:"BE-06", slug:"custom-product-display-stand", name:"Custom Product Display Stand", collection:"Business & Events", price:35, description:"A made-to-measure stand that presents a product at its best angle.", material:"PETG", colors, productionDays:8, personalized:true, badge:"From $35" },
  { id:"BE-07", slug:"event-favor-tags", name:"Event Favor Tags · Set of 20", collection:"Business & Events", price:49.99, description:"Personalized tags with consistent typography and event-ready packing.", material:"PLA", colors:giftColors, productionDays:7, personalized:true },
  { id:"BE-08", slug:"retail-price-card-holders", name:"Retail Price-Card Holders", collection:"Business & Events", price:24.99, description:"A clean reusable set for markets, counters, and pop-ups.", material:"PETG", colors, productionDays:5 },

  { id:"CP-01", slug:"print-uploaded-3d-file", name:"Print an Uploaded STL / 3MF", collection:"Custom 3D Print", price:25, description:"Upload a ready model for a material, size, and printability review.", material:"PLA / PETG", colors, productionDays:5, personalized:true, badge:"From $25" },
  { id:"CP-02", slug:"replacement-part-reproduction", name:"Replacement-Part Reproduction", collection:"Custom 3D Print", price:35, description:"Send photos and measurements for a practical, non-safety-critical replacement.", material:"PETG", colors, productionDays:8, personalized:true, badge:"From $35" },
  { id:"CP-03", slug:"prototype-printing", name:"Prototype Printing", collection:"Custom 3D Print", price:45, description:"A human-reviewed functional prototype with tolerance and material guidance.", material:"PLA / PETG", colors, productionDays:7, personalized:true, badge:"From $45" },
  { id:"CP-04", slug:"bulk-print-production", name:"Bulk Print Production", collection:"Custom 3D Print", price:0, description:"Small-batch production planning, print checks, packing, and a clear quote.", material:"By project", colors, productionDays:10, personalized:true, badge:"Request quote" },
];

export const BEST_SELLERS = PRODUCTS.filter((product) => product.featured);
