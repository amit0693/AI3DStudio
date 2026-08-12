import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppProvider } from '@/context/app-context';
import { colors, typography } from '@/constants/theme';

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.ink },
          headerTintColor: colors.ceramic,
          headerTitleStyle: { fontFamily: typography.display, fontSize: 21, fontWeight: '700' },
          contentStyle: { backgroundColor: colors.ceramic },
          headerBackButtonDisplayMode: 'minimal',
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="product/[slug]" options={{ title: 'Product details', presentation: 'card' }} />
        <Stack.Screen name="checkout" options={{ title: 'Checkout', presentation: 'card' }} />
        <Stack.Screen name="checkout-return" options={{ title: 'Order status', presentation: 'card' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings', presentation: 'card' }} />
      </Stack>
    </AppProvider>
  );
}
