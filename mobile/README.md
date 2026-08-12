# BayLayer Labs mobile

Phase 1 Expo/React Native customer app for iOS and Android. The app browses the BayLayer catalog, keeps a cart on-device, submits STL files for server-side estimates, and collects explicit-consent AI Scan early-access registrations.

Payments, production ordering, and camera scanning are intentionally disabled in this preview.

## Requirements

- Node.js 22.13 or newer
- Xcode 26.4 or newer for SDK 57 iOS native builds
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

## Privacy and security boundaries

- API configuration is stored locally with AsyncStorage; never enter a secret or access token.
- The app does not request camera access in Phase 1.
- The STL is copied into the app cache by the system document picker, then sent only when the customer asks for an estimate.
- Cart contents are stored on the device. No payment details are collected.
- Waitlist submission requires an explicit marketing-consent toggle.

## Publication

No App Store or Play Store release has been created. Before store submission, configure the team's Expo/EAS project, signing credentials, privacy declarations, screenshots, support URL, and production API access. Live checkout also requires a verified payment flow and backend webhook handling.
