import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Body, Button, Card, Eyebrow, Pill, Screen, Title } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { formatMoney } from '@/lib/api';

export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { products, addToCart } = useApp();
  const product = products.find((entry) => entry.slug === slug);
  if (!product) return <Screen><Title>Product unavailable</Title><Body>This product is no longer in the current catalog.</Body><Button label="Back to shop" onPress={() => router.back()} /></Screen>;
  return (
    <Screen>
      <View style={styles.art}><View style={styles.cube} /><View style={styles.base} /></View>
      <Eyebrow>{product.category}</Eyebrow>
      <Title>{product.name}</Title>
      <Text style={styles.price}>{formatMoney(product.price.amountCents, product.price.currency)}</Text>
      <Body>{product.description}</Body>
      <Card>
        <Pill>{product.material}</Pill>
        <Text style={styles.detail}>Made to order · {product.leadTimeDays.min}–{product.leadTimeDays.max} business days</Text>
        <Body muted>Customization details are confirmed by a person before production.</Body>
      </Card>
      <Button label="Add to cart" onPress={() => addToCart(product)} />
      <Button label="View cart" variant="secondary" onPress={() => router.push('/cart')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  art: { height: 210, backgroundColor: colors.mintPale, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  cube: { width: 110, height: 90, borderRadius: 20, backgroundColor: colors.orange, transform: [{ rotate: '-8deg' }] },
  base: { width: 150, height: 20, borderRadius: 8, backgroundColor: colors.ink, marginTop: 10 },
  price: { color: colors.ink, fontSize: 28, fontWeight: '900' },
  detail: { color: colors.text, fontWeight: '800', lineHeight: 21 },
});
