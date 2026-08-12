import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Pill } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { formatMoney } from '@/lib/api';
import type { Product } from '@/lib/types';

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useApp();
  return (
    <Card style={styles.card}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`View ${product.name}`}
        onPress={() => router.push({ pathname: '/product/[slug]', params: { slug: product.slug } })}>
        <View style={styles.art} accessible={false}>
          <View style={styles.artTop} />
          <View style={styles.artMiddle} />
          <View style={styles.artBase} />
        </View>
        <View style={styles.meta}>
          <Pill tone={product.featured ? 'orange' : 'mint'}>{product.category}</Pill>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.description}>{product.shortDescription}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatMoney(product.price.amountCents, product.price.currency)}</Text>
            <Text style={styles.lead}>{product.leadTimeDays.min}–{product.leadTimeDays.max} days</Text>
          </View>
        </View>
      </Pressable>
      <Button label="Add to cart" onPress={() => addToCart(product)} accessibilityHint={`Adds ${product.name} to your saved cart`} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 0, overflow: 'hidden', gap: 0 },
  art: { height: 160, backgroundColor: colors.mintPale, alignItems: 'center', justifyContent: 'center' },
  artTop: { width: 76, height: 30, borderRadius: radius.sm, backgroundColor: colors.orange, transform: [{ skewX: '-12deg' }] },
  artMiddle: { width: 108, height: 32, marginTop: -4, borderRadius: 8, backgroundColor: colors.forest },
  artBase: { width: 138, height: 18, marginTop: 4, borderRadius: 6, backgroundColor: colors.ink, opacity: 0.9 },
  meta: { padding: spacing.md, gap: spacing.sm },
  name: { color: colors.ink, fontSize: 21, fontWeight: '900' },
  description: { color: colors.muted, fontSize: 15, lineHeight: 21 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.sm },
  price: { color: colors.ink, fontSize: 20, fontWeight: '900' },
  lead: { color: colors.muted, fontSize: 12, fontWeight: '700' },
});
