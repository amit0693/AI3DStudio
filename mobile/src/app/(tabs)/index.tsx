import { RefreshControl, StyleSheet, Text, View } from 'react-native';

import { ProductCard } from '@/components/product-card';
import { Body, Card, Eyebrow, Pill, Screen, Title } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';

export default function ShopScreen() {
  const { products, catalogSource, catalogError, catalogLoading, refreshCatalog } = useApp();
  return (
    <Screen refreshControl={<RefreshControl refreshing={catalogLoading} onRefresh={() => void refreshCatalog()} tintColor={colors.orange} />}>
      <View style={styles.hero}>
        <Eyebrow>Made in the Bay Area</Eyebrow>
        <Title>Useful objects, printed locally.</Title>
        <Body>Small-batch 3D prints with clear pricing and a human printability check.</Body>
        <Pill tone={catalogSource === 'live' ? 'mint' : 'neutral'}>{catalogSource === 'live' ? 'Live catalog' : 'Offline catalog'}</Pill>
      </View>
      {catalogError ? (
        <Card style={styles.notice}>
          <Text style={styles.noticeTitle}>Showing bundled products</Text>
          <Body muted>The store API could not be reached. Pull down to retry. {catalogError}</Body>
        </Card>
      ) : null}
      <View style={styles.sectionHead}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>Launch collection</Text>
        <Text style={styles.count}>{products.length} products</Text>
      </View>
      {products.map((product) => <ProductCard key={product.id} product={product} />)}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.mint, borderRadius: 24, padding: spacing.lg, gap: spacing.md },
  notice: { borderLeftWidth: 4, borderLeftColor: colors.yellow },
  noticeTitle: { color: colors.ink, fontWeight: '900', fontSize: 16 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: spacing.sm },
  sectionTitle: { color: colors.ink, fontWeight: '900', fontSize: 24 },
  count: { color: colors.muted, fontSize: 13, fontWeight: '700' },
});
