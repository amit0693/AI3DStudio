import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Pill, ProductVisual } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { formatMoney } from '@/lib/api';
import type { Product } from '@/lib/types';

export function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const { addToCart } = useApp();
  const requiresOptions = Boolean(product.personalization?.length);

  function openProduct() {
    router.push({ pathname: '/product/[slug]', params: { slug: product.slug } });
  }

  return (
    <Card style={[styles.card, compact && styles.compactCard]}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`View ${product.name}`}
        accessibilityHint="Opens product details and options"
        onPress={openProduct}
        style={({ pressed }) => [pressed && styles.pressed]}>
        <ProductVisual product={product} height={compact ? 132 : 180} />
        <View style={[styles.meta, compact && styles.compactMeta]}>
          <View style={styles.badges}>
            {product.badge ? <Pill tone={product.badge === 'Best Seller' ? 'orange' : 'mint'}>{product.badge}</Pill> : null}
          </View>
          <Text numberOfLines={compact ? 2 : undefined} style={[styles.name, compact && styles.compactName]}>{product.name}</Text>
          {!compact ? <Text style={styles.description}>{product.shortDescription}</Text> : null}
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatMoney(product.price.amountCents, product.price.currency)}</Text>
            {!compact ? <Text style={styles.lead}>{product.leadTimeDays.min}–{product.leadTimeDays.max} days</Text> : null}
          </View>
        </View>
      </Pressable>
      <View style={[styles.action, compact && styles.compactAction]}>
        <Button
          compact
          label={requiresOptions ? 'Customize' : 'Quick add'}
          variant={requiresOptions ? 'secondary' : 'primary'}
          onPress={requiresOptions ? openProduct : () => addToCart(product)}
          accessibilityHint={requiresOptions ? `Choose options for ${product.name}` : `Adds ${product.name} to your cart`}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 0, overflow: 'hidden', gap: 0, borderRadius: radius.md },
  compactCard: { width: '48.2%', minWidth: 150 },
  pressed: { opacity: 0.86 },
  meta: { padding: spacing.md, gap: spacing.sm },
  compactMeta: { padding: 12, minHeight: 118 },
  badges: { minHeight: 24, flexDirection: 'row' },
  name: { color: colors.ink, fontSize: 20, lineHeight: 24, fontWeight: '900' },
  compactName: { fontSize: 16, lineHeight: 20, minHeight: 40 },
  description: { color: colors.muted, fontSize: 15, lineHeight: 21 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.sm },
  price: { color: colors.ink, fontSize: 19, fontWeight: '900' },
  lead: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  action: { padding: spacing.md, paddingTop: 0 },
  compactAction: { padding: 12, paddingTop: 0 },
});
