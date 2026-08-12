import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import { Body, Button, Card, Eyebrow, Field, Screen, Title } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { createOrder, formatMoney } from '@/lib/api';
import type { CheckoutDetails } from '@/lib/types';

export default function CheckoutScreen() {
  const { apiBaseUrl, cart, subtotalCents, saveOrder, clearCart } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [fulfillmentMethod, setFulfillmentMethod] = useState<'shipping' | 'pickup'>('shipping');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const idempotencyKey = useRef('');

  function validate() {
    if (!cart.length) return 'Your cart is empty.';
    if (!name.trim()) return 'Enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address.';
    if (fulfillmentMethod === 'shipping') {
      if (!line1.trim() || !city.trim()) return 'Enter your street address and city.';
      if (!/^[A-Za-z]{2}$/.test(state.trim())) return 'Enter a two-letter state code.';
      if (!/^\d{5}(?:-\d{4})?$/.test(postalCode.trim())) return 'Enter a valid US ZIP code.';
    }
    return '';
  }

  async function submit() {
    const problem = validate();
    if (problem) { setError(problem); return; }
    setPending(true); setError('');
    if (!idempotencyKey.current) idempotencyKey.current = `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    const details: CheckoutDetails = {
      name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim() || undefined, notes: notes.trim() || undefined, fulfillmentMethod,
      shippingAddress: fulfillmentMethod === 'shipping' ? { line1: line1.trim(), line2: line2.trim() || undefined, city: city.trim(), state: state.trim().toUpperCase(), postalCode: postalCode.trim(), country: 'US' } : undefined,
    };
    try {
      const result = await createOrder(apiBaseUrl, details, cart, idempotencyKey.current);
      saveOrder(result.order);
      if (result.checkout.url) {
        await WebBrowser.openBrowserAsync(result.checkout.url, { presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET });
        router.replace({ pathname: '/checkout-return', params: { token: result.order.trackingToken } });
      } else if (result.checkout.paid) {
        clearCart();
        router.replace({ pathname: '/checkout-return', params: { token: result.order.trackingToken } });
      } else {
        setError(result.checkout.message ?? 'Hosted payment is not available. Your unpaid order was saved; try again after the store is configured.');
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Checkout could not be started.');
    } finally {
      setPending(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={88}>
      <Screen>
        <Eyebrow>Hosted, verified payment</Eyebrow><Title>Checkout</Title>
        <Card><View style={styles.summary}><Text style={styles.summaryLabel}>{cart.reduce((sum, item) => sum + item.quantity, 0)} items</Text><Text style={styles.total}>{formatMoney(subtotalCents)}</Text></View><Body muted>Shipping and automatic sales tax are finalized by the server and Stripe.</Body></Card>
        <Card><Text style={styles.heading}>Contact</Text><Field label="Full name *" value={name} onChangeText={setName} autoComplete="name" /><Field label="Email *" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" /><Field label="Phone (optional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" /></Card>
        <Card><Text style={styles.heading}>Fulfillment</Text><View style={styles.methods}><Button compact label="Ship to me" variant={fulfillmentMethod === 'shipping' ? 'dark' : 'secondary'} onPress={() => setFulfillmentMethod('shipping')} /><Button compact label="Local pickup" variant={fulfillmentMethod === 'pickup' ? 'dark' : 'secondary'} onPress={() => setFulfillmentMethod('pickup')} /></View>{fulfillmentMethod === 'shipping' ? <><Field label="Street address *" value={line1} onChangeText={setLine1} autoComplete="street-address" /><Field label="Apartment, suite (optional)" value={line2} onChangeText={setLine2} /><Field label="City *" value={city} onChangeText={setCity} autoComplete="postal-address-locality" /><View style={styles.addressRow}><View style={styles.state}><Field label="State *" value={state} onChangeText={setState} autoCapitalize="characters" maxLength={2} autoComplete="postal-address-region" /></View><View style={styles.zip}><Field label="ZIP code *" value={postalCode} onChangeText={setPostalCode} keyboardType="numbers-and-punctuation" maxLength={10} autoComplete="postal-code" /></View></View></> : <Body muted>Pickup timing and location are confirmed after payment.</Body>}</Card>
        <Card><Text style={styles.heading}>Order notes</Text><Field label="Notes (optional)" value={notes} onChangeText={setNotes} multiline maxLength={1000} style={styles.notes} /></Card>
        {error ? <Card style={styles.errorCard}><Text accessibilityRole="alert" style={styles.error}>{error}</Text></Card> : null}
        <Button label="Continue to secure payment" loading={pending} disabled={!cart.length} onPress={() => void submit()} />
        <Body muted style={styles.center}>Personalization files upload securely before order creation. Card information is entered only on Stripe’s hosted page.</Body>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, summary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }, summaryLabel: { color: colors.ink, fontWeight: '900' }, total: { color: colors.ink, fontSize: 28, fontWeight: '900' }, heading: { color: colors.ink, fontSize: 20, fontWeight: '900' }, methods: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, addressRow: { flexDirection: 'row', gap: spacing.sm }, state: { flex: 1 }, zip: { flex: 2 }, notes: { minHeight: 90, paddingTop: 12, textAlignVertical: 'top' }, errorCard: { borderColor: colors.danger, backgroundColor: '#FFF1EE' }, error: { color: colors.danger, fontWeight: '800', lineHeight: 21 }, center: { textAlign: 'center' },
});
