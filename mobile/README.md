# BayLayer Labs mobile

Shared Expo/React Native storefront for iOS and Android. The app includes a complete 3D-print catalog, personalization options, an on-device cart, order-status boundaries, and server-verified STL estimates.

## Customer navigation

The five bottom tabs are:

1. **Home** — flagship product, benefits, best sellers, categories, and customization overview.
2. **Shop** — search, category chips, personalization/material/price filters, sorting, and product cards.
3. **Customize** — personalized-product discovery and the STL quote uploader.
4. **Orders** — honest empty state and an explanation of the future production timeline.
5. **Cart** — persisted product options, quantities, subtotal, and checkout boundaries.

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

- `src/lib/catalog.ts` contains the complete bundled catalog and is available offline.
- A successful live API response is merged with the bundled catalog so live products and pricing can coexist with the complete launch range.
- Eight flagship products use local imagery in `assets/products/`.
- Every other product has an accessible category-specific visual fallback; the app does not depend on remote images.

## Privacy and security boundaries

- API configuration is stored locally with AsyncStorage; never enter a secret or access token.
- The app does not request camera or broad photo-library access.
- Personalization images are selected through the system document picker and remain local while building the cart.
- An STL is copied into the app cache by the system document picker, then sent only when the customer taps **Calculate estimate**.
- Cart contents and customization filenames are stored on the device. Image bytes and payment details are not stored in the cart.
- Checkout, production ordering, and order history are intentionally disabled until verified backend flows exist.

## Publication

No App Store or Play Store release has been created. Before store submission, configure the team's Expo/EAS project, signing credentials, privacy declarations, screenshots, support URL, production API access, verified checkout, and backend fulfillment/webhook handling.
