# BayLayer Labs image asset audit

This document tracks the production imagery needed by both the responsive web storefront and the Expo mobile app.

## Shared image system

- Master product image: `1536 × 1024` PNG or high-quality WebP, 3:2 landscape.
- Composition: product centered in the middle 70% of the frame so the same source survives 3:2, 4:3, and square center crops.
- Art direction: warm cream grid wall, forest-green tabletop, directional natural window light, visible FDM layer texture, restrained mint/terracotta accents, no text, logos, watermarks, or unrelated products.
- Web location: `public/products/<catalog-slug>.png`.
- Mobile location: `mobile/assets/products/<catalog-slug>.png`, imported in `mobile/src/lib/product-assets.ts`.
- One shared master is sufficient for catalog cards, product detail, cart thumbnails, the web hero, and the mobile home hero. Separate desktop/mobile renders are not required.

## Section inventory

| Surface | Section / screen | Image requirement | Status |
|---|---|---|---|
| Web | Header + footer | Brand mark / favicon | Complete |
| Web | Hero | Photo Lithophane Night Light master product image | Complete |
| Web | Product catalog | One master image for every one of 64 products | 36 complete; 28 intentionally paused |
| Web | Product modal + cart | Reuse each product master | Covered by catalog masters |
| Web | Before / after | Customer-provided photo preview plus lithophane product master | Product side complete; uploaded/source side must remain user-owned or use a licensed demo image |
| Web | Shop by person | No raster image required by current design; intentionally typographic color cards | Complete as designed |
| Web | Process, reviews, custom print, business, materials, FAQ, newsletter | No raster image required by current design | Complete as designed |
| Web | Link preview | Open Graph social card | Complete |
| Web PWA | Install icons | 192, 512, Apple touch, SVG favicon | Complete |
| Mobile | Home hero | Reuse Photo Lithophane Night Light master | Complete |
| Mobile | Best sellers, shop grid, product detail, cart | Reuse catalog product masters | 36 wired; remaining products keep the existing fallback visual |
| Mobile | Shop by category, how it works, quote/customize, orders, settings | No raster image required by current design | Complete as designed |
| Mobile | Upload preview | User-provided photo/logo; no bundled image required | Runtime content |
| Mobile | App identity | App icon, adaptive/monochrome icon, splash icon, favicon | Complete |

## Important implementation notes

- The web filename mismatch for `custom-name-desk-sign` has been fixed by adding the catalog-slug copy.
- Mobile maps all 36 available product images in `mobile/src/lib/product-assets.ts`.
- Product images should remain free of embedded copy so localized UI can reuse them.

## Remaining product masters (generation paused)

No additional generation is needed until these products are prioritized. The current CSS/native fallback remains in place and prevents broken image UI.

- Plants & Decor: `window-sill-herb-planter.png`
- Gaming & Hobbies: `modular-tabletop-token-trays.png`, `adjustable-card-deck-box.png`, `dice-tower-folding-tray.png`, `trading-card-display-stands.png`, `universal-board-game-organizer.png`, `miniature-painting-tool-caddy.png`, `modular-dice-token-box.png`
- Seasonal: `holiday-ornament.png`, `led-tealight-lantern.png`, `graduation-name-year-sign.png`, `teacher-name-desk-sign.png`, `halloween-led-window-silhouette.png`, `valentine-coordinates-keepsake.png`, `family-photo-lithophane.png`, `stocking-name-tag.png`
- Business & Events: `wedding-place-name.png`, `table-number-set.png`, `qr-review-payment-sign.png`, `logo-counter-sign.png`, `branded-bag-tags.png`, `custom-product-display-stand.png`, `event-favor-tags.png`, `retail-price-card-holders.png`
- Custom 3D Print: `print-uploaded-3d-file.png`, `replacement-part-reproduction.png`, `prototype-printing.png`, `bulk-print-production.png`
