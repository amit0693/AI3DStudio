# BayLayer Labs

Phase 1 of a Bay Area 3D-printing business: a responsive storefront, a server-verified STL quote estimator, local-product catalog APIs, protected model uploads, order-intake foundations, and an AI camera-scan waitlist.

## What works now

- Browse the launch catalog and use the interactive cart.
- Upload an ASCII or binary STL (up to 25 MB) for a deterministic estimate.
- Submit an email to the camera-scan waitlist with explicit marketing consent.
- Install the responsive site as a progressive web app.
- Use D1-backed product, order, upload, quote, and waitlist APIs.

Checkout is intentionally unavailable until Stripe credentials and business policies are configured. Custom estimates require human review before production; shipping and tax are not included in the estimate.

## Local development

Requirements: Node.js 22.13 or newer.

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

## Validation

```bash
npm run lint
npm test
```

`npm test` performs a production build and verifies the rendered storefront and PWA assets. The D1 migration is in `drizzle/0000_slimy_frank_castle.sql`.

## Runtime bindings

Sites provisions the logical bindings declared in `.openai/hosting.json`:

- `DB`: Cloudflare D1 catalog and order data
- `UPLOADS`: Cloudflare R2 customer model files

Do not accept card data in this app. Add payments through a hosted provider checkout and verify its webhook server-side before moving an order out of `awaiting_payment`.
# AI3DStudio
