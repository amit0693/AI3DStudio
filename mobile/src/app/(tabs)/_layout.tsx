import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { colors } from '@/constants/theme';

type IconName =
  | { ios: 'house.fill'; android: 'home'; web: 'home' }
  | { ios: 'cube.transparent.fill'; android: 'view_in_ar'; web: 'view_in_ar' }
  | { ios: 'camera.fill'; android: 'photo_camera'; web: 'photo_camera' }
  | { ios: 'cart.fill'; android: 'shopping_cart'; web: 'shopping_cart' }
  | { ios: 'gearshape.fill'; android: 'settings'; web: 'settings' };

function TabIcon({ name, color }: { name: IconName; color: ColorValue }) {
  return <SymbolView name={name} size={24} tintColor={color} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.ink },
        headerTintColor: colors.cream,
        headerTitleStyle: { fontWeight: '800' },
        tabBarActiveTintColor: colors.orange,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.paper, borderTopColor: colors.line, minHeight: 64 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        sceneStyle: { backgroundColor: colors.cream },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Shop', tabBarAccessibilityLabel: 'Shop', tabBarIcon: ({ color }) => <TabIcon name={{ ios: 'house.fill', android: 'home', web: 'home' }} color={color} /> }}
      />
      <Tabs.Screen
        name="quote"
        options={{ title: 'Quote', tabBarAccessibilityLabel: 'Quote an STL', tabBarIcon: ({ color }) => <TabIcon name={{ ios: 'cube.transparent.fill', android: 'view_in_ar', web: 'view_in_ar' }} color={color} /> }}
      />
      <Tabs.Screen
        name="scan"
        options={{ title: 'AI Scan', tabBarAccessibilityLabel: 'AI Scan coming soon', tabBarIcon: ({ color }) => <TabIcon name={{ ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' }} color={color} /> }}
      />
      <Tabs.Screen
        name="cart"
        options={{ title: 'Cart', tabBarAccessibilityLabel: 'Cart', tabBarIcon: ({ color }) => <TabIcon name={{ ios: 'cart.fill', android: 'shopping_cart', web: 'shopping_cart' }} color={color} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarAccessibilityLabel: 'Settings', tabBarIcon: ({ color }) => <TabIcon name={{ ios: 'gearshape.fill', android: 'settings', web: 'settings' }} color={color} /> }}
      />
    </Tabs>
  );
}
