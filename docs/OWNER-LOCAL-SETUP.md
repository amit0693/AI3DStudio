# BayLayer Labs owner handoff and local setup

This guide gives the business owner direct control of the web source, iOS/Android source, local database, private local uploads, test payments, backups, and release accounts.

## 1. What you own locally

The project is currently located at:

```text
/Users/vn59k3j/Desktop/AI3D
```

Important locations:

| Area | Location |
| --- | --- |
| Web storefront and API | `app/` |
| Product/business data | `app/data/` |
| Database schema | `db/schema.ts` |
| Ordered database migrations | `drizzle/` |
| Web tests | `tests/` |
| iOS/Android Expo app | `mobile/` |
| Mobile launch catalog | `mobile/src/lib/catalog.ts` |
| Mobile screens | `mobile/src/app/` |
| Local D1/R2 data | `.wrangler/state/` (ignored by Git) |
| Local backups | `.local-backups/` (ignored by Git) |
| Production Sites identity | `.openai/hosting.json` |

The latest commerce handoff commit is `a6d3c4f` on branch `codex/AI3DStudio`. The working directory also contains separate, uncommitted image-asset work; do not delete or overwrite it accidentally.

## 2. Accounts the owner should control

Use a company-controlled email, enable two-factor authentication, add a second recovery owner, and store recovery codes in a password manager for each account:

1. GitHub repository: `https://github.com/amit0693/AI3DStudio`
2. OpenAI Sites project for `baylayer-labs.amitcodecraft.chatgpt.site`
3. Stripe business account, bank account, tax settings, API keys, and webhook
4. Expo/EAS organization
5. Apple Developer Program and App Store Connect
6. Google Play Console and its service account
7. Business domain/DNS and support email

Never put Stripe secret keys, webhook secrets, Apple credentials, Google service-account files, or recovery codes in Git.

## 3. Mac prerequisites

Install:

- Git
- Node.js 22.13 or newer (`node --version`)
- npm (`npm --version`)
- Xcode and its command-line tools for iOS
- Android Studio, an Android SDK, emulator, and compatible JDK for Android
- `sqlite3` (included with macOS command-line tools)
- Stripe CLI for local webhook testing
- EAS CLI through `npx eas-cli` when building store packages

## 4. First web setup

```bash
cd /Users/vn59k3j/Desktop/AI3D
npm ci
npm run dev
```

Open `http://localhost:3000`. The first start creates local Cloudflare-compatible D1 and R2 storage under `.wrangler/state/`.

In a second terminal, initialize or update the local database:

```bash
cd /Users/vn59k3j/Desktop/AI3D
npm run db:migrate:local
```

Then restart `npm run dev`. The migration command automatically creates a safety backup first.

Useful database commands:

```bash
npm run db:summary:local
npm run db:console:local
npm run db:backup:local
```

Inside the SQLite console, useful read-only queries include:

```sql
.tables
.headers on
.mode column
SELECT id, name, base_price_cents, minimum_quantity FROM products WHERE is_active = 1;
SELECT order_number, status, payment_status, total_cents, created_at FROM orders ORDER BY created_at DESC;
SELECT status, count(*) FROM orders GROUP BY status;
.quit
```

Stop the web server before manually copying or restoring `.wrangler/state/`. Production Sites data is separate; local commands do not download, overwrite, or back up production data.

## 5. Local Stripe test payments

Use Stripe **test mode**, never live keys, for local development.

Create `.env.local` in the project root:

```dotenv
STRIPE_SECRET_KEY=sk_test_replace_me
STRIPE_WEBHOOK_SECRET=whsec_replace_me
```

Start the local webhook forwarder in another terminal:

```bash
stripe login
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

Copy the displayed `whsec_...` signing secret into `.env.local`, restart `npm run dev`, and place an order with a Stripe test card such as `4242 4242 4242 4242`, any future expiry, and any CVC. Confirm the order becomes `paid` only after the verified webhook.

Do not commit `.env.local`. Production Stripe values belong in the Sites environment, not in source files.

## 6. Run iOS locally

Start the web API first and migrate its local database. Then:

```bash
cd /Users/vn59k3j/Desktop/AI3D/mobile
npm ci
npm run ios
```

In the iOS Simulator app, open Settings and use:

```text
http://localhost:3000
```

A physical iPhone cannot use the Mac's `localhost`. Use the Mac's LAN address, for example `http://192.168.1.20:3000`, keep both devices on the same network, and allow the connection through the Mac firewall. Production devices should use the public HTTPS site.

## 7. Run Android locally

Create and start an Android emulator in Android Studio, then:

```bash
cd /Users/vn59k3j/Desktop/AI3D/mobile
npm run android
```

In mobile Settings use:

```text
http://10.0.2.2:3000
```

That special address lets the Android Emulator reach the Mac. A physical Android phone needs the Mac's LAN address or the public HTTPS site.

## 8. Validation commands

Web:

```bash
cd /Users/vn59k3j/Desktop/AI3D
npm run lint
npx tsc --noEmit
npm test
```

Mobile:

```bash
cd /Users/vn59k3j/Desktop/AI3D/mobile
npm run check
npm run export:ios
npm run export:android
```

## 9. Git access and safe backups

Inspect the current source state:

```bash
cd /Users/vn59k3j/Desktop/AI3D
git status
git branch --show-current
git remote -v
git log --oneline -5
```

To clone onto another Mac after the current branch has been pushed to GitHub:

```bash
git clone https://github.com/amit0693/AI3DStudio.git
cd AI3DStudio
git switch codex/AI3DStudio
npm ci
cd mobile && npm ci
```

The latest local commit may be ahead of GitHub. Verify the remote branch contains `a6d3c4f` before relying on a fresh clone. Do not run destructive Git commands against the current folder while the uncommitted image work remains.

## 10. Production release ownership

Web production currently uses the Sites project ID stored in `.openai/hosting.json`, with logical bindings:

- `DB`: production D1 database
- `UPLOADS`: production private R2 bucket
- `STRIPE_SECRET_KEY`: server-only Stripe key
- `STRIPE_WEBHOOK_SECRET`: server-only Stripe webhook signing secret

The current site is owner-only. Making it public changes who can access the store and webhook, so do that only after Stripe test checkout, policies, support email, fulfillment, and refund handling are approved.

For mobile store builds:

```bash
cd /Users/vn59k3j/Desktop/AI3D/mobile
npx eas-cli login
npx eas-cli init
npm run build:ios
npm run build:android
```

`eas init` adds the Expo project ownership identifier. Store submission additionally requires Apple/Google agreements, signing credentials, privacy answers, screenshots, support URLs, review notes, and production API access. Do not invent or share these credentials in source.

## 11. Before every production change

1. Back up production data using the hosting provider's supported export process.
2. Test the migration on local D1.
3. Run all web and mobile checks.
4. Test customization, durable file upload, minimum quantity, shipping threshold, payment success/failure, duplicate webhook, refund, and order tracking.
5. Deploy privately first and inspect it.
6. Publish publicly only with owner approval.
