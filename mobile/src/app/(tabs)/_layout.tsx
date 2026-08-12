import { SymbolView } from 'expo-symbols';
import { router, Tabs } from 'expo-router';
import { ColorValue, Pressable, StyleSheet, View } from 'react-native';

import { colors } from '@/constants/theme';
import { useApp } from '@/context/app-context';

const icons = {
  home: { ios: 'house.fill', android: 'home', web: 'home' },
  shop: { ios: 'square.grid.2x2.fill', android: 'grid_view', web: 'grid_view' },
  customize: { ios: 'wand.and.stars', android: 'auto_awesome', web: 'auto_awesome' },
  orders: { ios: 'shippingbox.fill', android: 'inventory_2', web: 'inventory_2' },
  cart: { ios: 'cart.fill', android: 'shopping_cart', web: 'shopping_cart' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  account: { ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' },
} as const;

function TabIcon({ name, color }: { name: keyof Pick<typeof icons, 'home' | 'shop' | 'customize' | 'orders' | 'cart'>; color: ColorValue }) {
  return <SymbolView name={icons[name]} size={23} tintColor={color} />;
}

function HeaderActions() {
  return (
    <View style={styles.headerActions}>
      <Pressable accessibilityRole="button" accessibilityLabel="Search products" hitSlop={8} onPress={() => router.navigate('/shop')} style={styles.headerButton}>
        <SymbolView name={icons.search} size={22} tintColor={colors.ceramic} />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Account and settings" hitSlop={8} onPress={() => router.push('/settings')} style={styles.headerButton}>
        <SymbolView name={icons.account} size={24} tintColor={colors.ceramic} />
      </Pressable>
    </View>
  );
}

export default function TabLayout() {
  const { cartCount } = useApp();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.ink },
        headerTintColor: colors.ceramic,
        headerTitleStyle: { fontWeight: '900' },
        headerRight: HeaderActions,
        tabBarActiveTintColor: colors.action,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.paper, borderTopColor: colors.line, minHeight: 68, paddingTop: 5 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '800', paddingBottom: 3 },
        tabBarHideOnKeyboard: true,
        sceneStyle: { backgroundColor: colors.ceramic },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <TabIcon name="home" color={color} /> }} />
      <Tabs.Screen name="shop" options={{ title: 'Shop', tabBarIcon: ({ color }) => <TabIcon name="shop" color={color} /> }} />
      <Tabs.Screen name="customize" options={{ title: 'Customize', tabBarIcon: ({ color }) => <TabIcon name="customize" color={color} /> }} />
      <Tabs.Screen name="orders" options={{ title: 'Orders', tabBarIcon: ({ color }) => <TabIcon name="orders" color={color} /> }} />
      <Tabs.Screen name="cart" options={{ title: 'Cart', tabBarBadge: cartCount || undefined, tabBarBadgeStyle: styles.badge, tabBarIcon: ({ color }) => <TabIcon name="cart" color={color} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: 'row', alignItems: 'center', marginRight: 8, gap: 2 },
  headerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  badge: { backgroundColor: colors.action, color: colors.white, fontWeight: '900' },
});
