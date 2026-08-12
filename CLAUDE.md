# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

BayLayer Labs: a Bay Area 3D-printing storefront (Phase 1) — responsive catalog, protected personalization/model uploads, server-authoritative orders, Stripe-hosted checkout, and an AI camera-scan waitlist. There is a companion Expo/React Native app in `mobile/` that talks to the same backend.

## Commands

Web (run from repo root):

```bash
npm ci                    # install
npm run dev                # vinext dev server on http://localhost:3000, backed by local Wrangler D1/R2
npm run build               # production build (vinext build)
npm run lint                 # eslint .
npx tsc --noEmit               # typecheck (no dedicated script; run directly)
npm test                        # npm run build + node --test tests/*.test.mjs (build is required first)
node --test tests/commerce-contract.test.mjs   # run a single test file (after `npm run build` if it needs dist/)
```

Database (D1, local via Wrangler state under `.wrangler/state/`, wraps `scripts/local-database.mjs`):

```bash
npm run db:generate           # drizzle-kit generate → new SQL file in drizzle/
npm run db:migrate:local        # apply drizzle/ migrations to local D1 (backs itself up first)
npm run db:summary:local         # quick counts/overview of local tables
npm run db:console:local          # interactive sqlite3 console on the local D1 file
npm run db:backup:local            # snapshot local D1/R2 state into .local-backups/
```

Mobile (run from `mobile/`; see `mobile/CLAUDE.md` / `mobile/AGENTS.md` before editing Expo code):

```bash
npm ci
npm run ios / npm run android / npm run web
npm run check              # lint + typecheck + expo-doctor
npm run export:ios / npm run export:android
```

Stripe webhooks locally require `stripe listen --forward-to http://localhost:3000/api/webhooks/stripe`; secrets go in an untracked `.env.local` (see `.env.example` for the full variable list — `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`/`SECRET`, `RESEND_API_KEY`, `AUTH_EMAIL_FROM`). Without Stripe secrets configured, checkout endpoints respond with `checkout.available: false` instead of collecting card data — this is expected, not a bug.

## Architecture

**Runtime is not standard Next.js.** The `app/` directory uses Next.js App Router file conventions and `next.config.ts` exists as a stub, but the app actually runs on `vinext` (a Vite + React Server Components runtime) deployed as a Cloudflare Worker — see `vite.config.ts` and `worker/index.ts`. `worker/index.ts` is the real entry point: it serves `/_vinext/image` itself (Cloudflare Images-backed optimization) and otherwise delegates to `vinext/server/app-router-entry`, wrapping every response in `withSecurityHeaders` (strict CSP, no external script/style/connect sources). Don't add per-route security headers that could conflict with this CSP.

**Cloudflare bindings are centralized in `db/index.ts`.** `.openai/hosting.json` declares the logical binding names (`DB` → D1, `UPLOADS` → R2); `vite.config.ts` wires them into local Wrangler config for `npm run dev`, and the Sites platform provisions the same names in production. Runtime access always goes through `db/index.ts`'s `getD1()`, `getUploadsBucket()`, `getDb()` (Drizzle-wrapped D1), `getStripeConfig()`, and `getAuthConfig()` — these throw descriptive errors when a binding is missing rather than silently failing. Don't reach into `cloudflare:workers` env or `process.env` directly elsewhere for these values.

**Schema and migrations.** `db/schema.ts` is the single Drizzle (sqlite dialect) source of truth; `drizzle/*.sql` are ordered, already-generated migrations (`npm run db:generate` adds new ones, never hand-edit existing ones). Key tables: `products`, `uploads` (generic customer STL/OBJ/3MF for quotes), `personalization_uploads` (separate, shorter-lived per-order-item file uploads with their own access-token hash + expiry), `orders`/`order_items`/`order_status_history`/`payment_events`, `quotes`, `waitlist_entries`. Better Auth's `user`/`session`/`account`/`verification` tables live in the same schema/database (aliased as `authUsers`/`authSessions`/`authAccounts`/`authVerifications`) so the website and the Expo app share one account and session store.

**Auth** (`lib/auth.ts`): Better Auth configured with the D1-backed Drizzle adapter, the Expo plugin (for `mobile/`), optional Google OAuth, and email-OTP sign-in sent via Resend (`lib/auth-email.ts`). `authAvailability.{core,google,emailOtp}` reflect which secrets are actually configured so routes/UI can degrade gracefully instead of assuming all are present. The catch-all route is `app/api/auth/[...all]/route.ts`.

**Commerce API routes** (`app/api/*/route.ts`) are plain Fetch API `Request`/`Response` handlers with no framework middleware. Shared request/response plumbing lives in `lib/api/` (barrel: `@/lib/api`) — `ApiError`, `json`/`CACHEABLE_HEADERS`/`handleApiError`, `readJsonObject`/`isPlainObject`, `isMultipartFormData`/`assertContentLengthWithin`/`readFormFile`/`readFormText`, `readPathParam`, `cleanText`/`cleanEmail`/`integerInRange`/`oneOf`/`parseJsonColumn`, `sha256Hex`/`randomToken`/`prefixedId`, `PRODUCT_COLUMNS`/`publicProduct`, `orderAmounts` — reuse these instead of reimplementing validation or error shaping in a new route. Client-side counterparts live in `lib/format/money.ts`, `lib/http/json-request.ts`, and `lib/errors.ts`.

**Order creation** (`app/api/orders/route.ts`) is the core server-authoritative path: it re-fetches product rows from D1 and re-derives every price and personalization constraint from `personalization_schema_json` server-side (a submitted price is never trusted), validates file-upload personalization fields against tokens issued by `/api/personalization-uploads`, computes Phase 1 US shipping ($6.99 flat under a $65 subtotal, free at/above), and opens a Stripe Checkout Session with `automatic_tax` enabled. The whole flow is idempotent on a required `Idempotency-Key` (header or body): a repeat call with the same key returns/refreshes the existing order and Checkout session instead of creating a duplicate order.

**Stripe integration** (`app/api/stripe/_shared.ts`, `app/api/webhooks/stripe/route.ts`) talks to the raw Stripe REST API over `fetch` (no Stripe SDK) and hand-verifies webhook signatures (HMAC-SHA256 over `${timestamp}.${rawBody}`, constant-time comparison). The webhook handler is the *only* place an order's `payment_status` moves to `paid` — never flip payment/order status from a client-side checkout redirect.

**Quote engine** (`lib/quote/`): `stl.ts` parses ASCII/binary STL uploads into a `GeometryReport`; `calculator.ts` + `config.ts` price a quote from that geometry plus material/quality/infill selection; `validation.ts` enforces selection/geometry invariants. Used by `/api/quotes` and `app/components/quote/QuoteBuilder.tsx`. Estimates are client-facing only — production quotes require human review per the README.

**Storefront data**: `app/data/catalog.ts` and `app/data/company.ts` hold the static Phase 1 launch catalog (8 SKUs) rendered by `app/page.tsx` / `app/components/storefront/StorefrontExperience.tsx`. `tests/commerce-contract.test.mjs` asserts the seeded D1 catalog's SKUs/prices/minimum quantities match an `expected` array in that test — update it there whenever launch pricing changes, and keep it in sync with `app/data/catalog.ts`.

**Tests** (`tests/*.test.mjs`, plain `node --test`, no test framework): `rendered-html.test.mjs` imports the *built* worker bundle from `dist/server/index.js` to assert on server-rendered HTML and PWA assets — it requires `npm run build` to have already run, which is why `npm test` always builds first. `commerce-contract.test.mjs` applies `drizzle/*.sql` in order against a throwaway SQLite file via the `sqlite3` CLI and checks the seeded catalog.

**Mobile app** (`mobile/`) is a separate Expo/React Native project with its own `package.json`, ESLint config, and `mobile/CLAUDE.md` (which defers to `mobile/AGENTS.md`) — read that before editing anything under `mobile/`. It mirrors the web's product/order/auth contracts via `mobile/src/lib/api.ts`, `auth-client.ts`, and `catalog.ts`, and shares the same Better Auth account/session store through the Expo plugin configured in `lib/auth.ts`. The root ESLint config explicitly ignores `mobile/**`.
