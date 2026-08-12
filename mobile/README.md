# BayLayer Labs mobile

Shared Expo/React Native storefront for iOS and Android. The app includes the focused eight-product launch catalog, schema-driven personalization, an editable on-device cart, hosted Stripe Checkout, persisted order tracking, and server-verified STL estimates.

## Customer navigation

The five bottom tabs are:

1. **Home** — flagship product, benefits, best sellers, categories, and customization overview.
2. **Shop** — search, category chips, personalization/material/price filters, sorting, and product cards.
3. **Customize** — personalized-product discovery and the STL quote uploader.
4. **Orders** — persisted order references with verified payment, production, and delivery timelines.
5. **Cart** — persisted product options, file selections, quantities, editing, and secure checkout.

Settings is intentionally outside the five tabs. Open it from the account icon in any tab header. The search icon opens Shop.

## Requirements

- Node.js 22.13 or newer
- Xcode 26.4 or newer for Expo SDK 57 iOS native builds
- Android Studio with an SDK 57-compatible Android SDK/JDK for native Android builds
- Expo SDK 57 / React Native 0.86

## Run

```sh
npm install
npm run ios
```

Use Settings inside the app to select the API base URL. `http://localhost:3000` works from the iOS Simulator when the web API runs on the same Mac. A physical iPhone needs the Mac's LAN address or a reachable HTTPS deployment.

For Android, run `npm run android`. The Android Emulator reaches a server on the same Mac at `http://10.0.2.2:3000`; `localhost` means the emulator itself. A physical Android device needs the Mac's LAN address while both are on the same network, or a reachable HTTPS deployment. Local cleartext HTTP is for development only—use HTTPS for production.

## Validate

```sh
npm run check
npx expo export --platform ios --output-dir dist-ios
npx expo export --platform android --output-dir dist-android
```

## Catalog and product imagery

- `src/lib/catalog.ts` contains exactly the eight launch products and is available offline.
- A successful live API response is authoritative, so products deactivated on the server do not reappear from the fallback catalog.
- Products use available local imagery in `assets/products/` and an accessible category-specific fallback when no local asset exists.
- The offline launch catalog does not depend on remote images.

## Privacy and security boundaries

- API configuration is stored locally with AsyncStorage; never enter a secret or access token.
- The app does not request camera or broad photo-library access.
- Personalization files are selected through the system document picker, remain local while building the cart, and upload to durable private storage only when checkout starts.
- An STL is copied into the app cache by the system document picker, then sent only when the customer taps **Calculate estimate**.
- Cart contents and local file references are stored on the device. Payment details are entered only on Stripe's hosted checkout.
- Public order tracking tokens are stored on-device and used to retrieve verified status from the backend.

## Publication

`eas.json` and build/submit scripts contain no project, account, or credential IDs. Before store submission, configure the team's Expo/EAS project, signing credentials, privacy declarations, screenshots, support URL, production API access, Stripe secrets/webhook, and final store metadata.
