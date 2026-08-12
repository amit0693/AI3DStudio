# BayLayer Labs

Phase 1 of a Bay Area 3D-printing business: a responsive storefront, eight-product launch catalog, protected personalization/model uploads, server-authoritative orders, Stripe-hosted checkout, and an AI camera-scan waitlist.

Business owners: follow the complete local web, mobile, database, payment-test, backup, and release handoff in [`docs/OWNER-LOCAL-SETUP.md`](docs/OWNER-LOCAL-SETUP.md).

## What works now

- Browse the launch catalog and use the interactive cart.
- Upload an ASCII or binary STL (up to 25 MB) for a deterministic estimate.
- Submit an email to the camera-scan waitlist with explicit marketing consent.
- Install the responsive site as a progressive web app.
- Use D1-backed product, order, upload, quote, and waitlist APIs.
- Create server-repriced orders and redirect to Stripe-hosted Checkout when Stripe secrets are present.
- Track payment/order state through an unguessable order link; only verified Stripe webhooks mark payment paid.

Without Stripe credentials, checkout stops safely before collecting card data. Custom STL estimates require human review before production. Phase 1 US orders use $6.99 shipping below $65 and free shipping at $65; Stripe Tax calculates tax in hosted checkout.

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

`npm test` performs a production build and verifies the rendered storefront and PWA assets. Apply the ordered SQL migrations in `drizzle/` to the Sites D1 database before enabling checkout.

## Runtime bindings

Sites provisions the logical bindings declared in `.openai/hosting.json`:

- `DB`: Cloudflare D1 catalog and order data
- `UPLOADS`: Cloudflare R2 customer model files
- `STRIPE_SECRET_KEY`: Stripe secret key used only by server routes
- `STRIPE_WEBHOOK_SECRET`: signing secret for `/api/webhooks/stripe`

Copy `.env.example` for local secret names; never commit real values. Configure the webhook for Checkout completed, async success/failure, expired, and refund events. Do not accept card data in this app and never move an order out of `awaiting_payment` based on the browser redirect alone.
# AI3DStudio
