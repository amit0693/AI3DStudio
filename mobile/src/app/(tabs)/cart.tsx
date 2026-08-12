import { router } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Body, Button, Card, EmptyState, Eyebrow, ProductVisual, Screen, Title } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { formatMoney } from '@/lib/api';

const FREE_SHIPPING_CENTS = 6500;

export default function CartScreen() {
  const { cart, cartCount, subtotalCents, hydrated, updateQuantity, removeFromCart, clearCart } = useApp();
  const shippingRemaining = Math.max(0, FREE_SHIPPING_CENTS - subtotalCents);
  const progress = Math.min(1, subtotalCents / FREE_SHIPPING_CENTS);

  function confirmClear() {
    Alert.alert('Clear your cart?', 'This removes every saved item from this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear cart', style: 'destructive', onPress: clearCart },
    ]);
  }

  return (
    <Screen>
      <Eyebrow>Saved on this device</Eyebrow>
      <Title>Your cart</Title>
      {!hydrated ? <Card><Body muted>Restoring your saved cart…</Body></Card> : null}
      {hydrated && !cart.length ? (
        <EmptyState title="Your cart is ready for something useful" message="Browse practical prints or start a personalized gift. Your selections stay on this device." action={<Button label="Start shopping" onPress={() => router.navigate('/shop')} />} />
      ) : null}
      {cart.length ? (
        <>
          <Card style={styles.shipping}>
            <Text style={styles.shippingTitle}>{shippingRemaining ? `${formatMoney(shippingRemaining)} away from free shipping` : 'You unlocked free shipping'}</Text>
            <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress * 100}%` }]} /></View>
            <Body muted>Estimated shipping offer applies to eligible US orders after checkout is connected.</Body>
          </Card>
          <Body muted>{cartCount} item{cartCount === 1 ? '' : 's'} ready for review.</Body>
          {cart.map(({ key, product, quantity, options }) => (
            <Card key={key} style={styles.item}>
              <View style={styles.itemRow}>
                <View style={styles.thumb}><ProductVisual product={product} height={108} /></View>
                <View style={styles.itemCopy}>
                  <Text style={styles.name}>{product.name}</Text>
                  <Text style={styles.price}>{formatMoney(product.price.amountCents)} each</Text>
                  {options?.color ? <Text style={styles.option}>Color: {options.color}</Text> : null}
                  {options?.material ? <Text style={styles.option}>Material: {options.material}</Text> : null}
                  {options?.personalization ? <Text numberOfLines={2} style={styles.option}>Text: {options.personalization}</Text> : null}
                  {options?.uploadName ? <Text numberOfLines={1} style={styles.option}>File: {options.uploadName}</Text> : null}
                </View>
              </View>
              <View style={styles.lineRow}>
                <View style={styles.counter}>
                  <Button label="−" variant="ghost" compact disabled={quantity <= (product.minimumQuantity ?? 1)} onPress={() => updateQuantity(key, -1)} accessibilityHint={`Remove one ${product.name}`} />
                  <Text accessibilityLabel={`Quantity ${quantity}`} style={styles.quantity}>{quantity}</Text>
                  <Button label="+" variant="ghost" compact disabled={quantity >= 100} onPress={() => updateQuantity(key, 1)} accessibilityHint={`Add one ${product.name}`} />
                </View>
                <Text style={styles.lineTotal}>{formatMoney(product.price.amountCents * quantity)}</Text>
              </View>
              <Button label="Remove item" variant="ghost" compact onPress={() => removeFromCart(key)} />
            </Card>
          ))}
          <Card style={styles.summary}>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Estimated subtotal</Text><Text style={styles.subtotal}>{formatMoney(subtotalCents)}</Text></View>
            <View style={styles.rule} />
            <View style={styles.summaryRow}><Text style={styles.summaryMuted}>Shipping</Text><Text style={styles.summaryMuted}>Calculated later</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryMuted}>Sales tax</Text><Text style={styles.summaryMuted}>Calculated later</Text></View>
          </Card>
          <Button label="Checkout coming soon" onPress={() => undefined} disabled accessibilityHint="Payments are not available in this preview" />
          <Body muted style={styles.center}>No payment information is collected. A verified checkout and backend fulfillment flow must be connected before launch.</Body>
          <Button label="Continue shopping" variant="secondary" onPress={() => router.navigate('/shop')} />
          <Button label="Clear cart" variant="ghost" onPress={confirmClear} />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  shipping: { backgroundColor: colors.icePale }, shippingTitle: { color: colors.ink, fontWeight: '900', fontSize: 16 },
  progressTrack: { height: 9, borderRadius: 5, overflow: 'hidden', backgroundColor: colors.line }, progressFill: { height: 9, borderRadius: 5, backgroundColor: colors.action },
  item: { gap: spacing.md }, itemRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  thumb: { width: 108, borderRadius: radius.sm, overflow: 'hidden' }, itemCopy: { flex: 1, gap: 3 },
  name: { color: colors.ink, fontSize: 17, lineHeight: 21, fontWeight: '900' }, price: { color: colors.muted, fontSize: 13 }, option: { color: colors.text, fontSize: 12, lineHeight: 16 },
  lineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 8 }, quantity: { minWidth: 26, textAlign: 'center', color: colors.ink, fontSize: 18, fontWeight: '900' },
  lineTotal: { color: colors.ink, fontSize: 19, fontWeight: '900' },
  summary: { backgroundColor: colors.paper }, summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: spacing.md },
  summaryLabel: { color: colors.ink, fontSize: 17, fontWeight: '900' }, subtotal: { color: colors.ink, fontSize: 25, fontWeight: '900' },
  summaryMuted: { color: colors.muted, fontSize: 14 }, rule: { height: 1, backgroundColor: colors.line, marginVertical: 3 }, center: { textAlign: 'center' },
});
