import { StyleSheet, Text, View } from 'react-native';

import { Body, Button, Card, Eyebrow, Screen, Title } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { formatMoney } from '@/lib/api';

export default function CartScreen() {
  const { cart, cartCount, subtotalCents, updateQuantity, clearCart } = useApp();
  return (
    <Screen>
      <Eyebrow>Saved on this device</Eyebrow>
      <Title>Your cart</Title>
      <Body muted>{cartCount ? `${cartCount} item${cartCount === 1 ? '' : 's'} ready for review.` : 'Your cart is empty.'}</Body>
      {cart.map(({ product, quantity }) => (
        <Card key={product.id}>
          <View style={styles.row}>
            <View style={styles.itemCopy}>
              <Text style={styles.name}>{product.name}</Text>
              <Text style={styles.price}>{formatMoney(product.price.amountCents)} each</Text>
            </View>
            <Text style={styles.lineTotal}>{formatMoney(product.price.amountCents * quantity)}</Text>
          </View>
          <View style={styles.quantityRow}>
            <Button label="−" variant="secondary" onPress={() => updateQuantity(product.id, -1)} accessibilityHint={`Remove one ${product.name}`} />
            <Text accessibilityLabel={`Quantity ${quantity}`} style={styles.quantity}>{quantity}</Text>
            <Button label="+" variant="secondary" onPress={() => updateQuantity(product.id, 1)} accessibilityHint={`Add one ${product.name}`} />
          </View>
        </Card>
      ))}
      {cart.length ? (
        <>
          <Card style={styles.summary}>
            <View style={styles.row}><Text style={styles.summaryLabel}>Estimated subtotal</Text><Text style={styles.subtotal}>{formatMoney(subtotalCents)}</Text></View>
            <Body muted>Shipping, pickup availability, and California sales tax are not calculated yet.</Body>
          </Card>
          <Button label="Checkout coming soon" onPress={() => undefined} disabled accessibilityHint="Payments are not available in this preview" />
          <Body muted style={styles.center}>No payment information is collected. A verified Stripe checkout will be connected before launch.</Body>
          <Button label="Clear cart" variant="ghost" onPress={clearCart} />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
  itemCopy: { flex: 1, gap: 4 },
  name: { color: colors.ink, fontSize: 17, fontWeight: '900' },
  price: { color: colors.muted, fontSize: 13 },
  lineTotal: { color: colors.ink, fontSize: 17, fontWeight: '900' },
  quantityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: spacing.md },
  quantity: { minWidth: 24, textAlign: 'center', color: colors.ink, fontSize: 18, fontWeight: '900' },
  summary: { backgroundColor: colors.mintPale },
  summaryLabel: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  subtotal: { color: colors.ink, fontSize: 24, fontWeight: '900' },
  center: { textAlign: 'center' },
});
