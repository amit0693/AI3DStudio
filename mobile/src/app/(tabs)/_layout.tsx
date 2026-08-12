import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';

import { colors } from '@/constants/theme';

type IconName = 'house.fill' | 'cube.transparent.fill' | 'camera.fill' | 'cart.fill' | 'gearshape.fill';

function TabIcon({ name, color }: { name: IconName; color: string }) {
  return <SymbolView name={name} size={22} tintColor={color} />;
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
        tabBarStyle: { backgroundColor: colors.paper, borderTopColor: colors.line },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        sceneStyle: { backgroundColor: colors.cream },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Shop', tabBarIcon: ({ color }) => <TabIcon name="house.fill" color={color} /> }}
      />
      <Tabs.Screen
        name="quote"
        options={{ title: 'Quote', tabBarIcon: ({ color }) => <TabIcon name="cube.transparent.fill" color={color} /> }}
      />
      <Tabs.Screen
        name="scan"
        options={{ title: 'AI Scan', tabBarIcon: ({ color }) => <TabIcon name="camera.fill" color={color} /> }}
      />
      <Tabs.Screen
        name="cart"
        options={{ title: 'Cart', tabBarIcon: ({ color }) => <TabIcon name="cart.fill" color={color} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarIcon: ({ color }) => <TabIcon name="gearshape.fill" color={color} /> }}
      />
    </Tabs>
  );
}
