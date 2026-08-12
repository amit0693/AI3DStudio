import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Body, Button, Card, EmptyState, Eyebrow, Pill, Screen, Title } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { fetchOrder, formatMoney } from '@/lib/api';
import type { OrderDetail } from '@/lib/types';

export default function OrdersScreen() {
  const { apiBaseUrl, savedOrders, removeSavedOrder } = useApp();
  const [details, setDetails] = useState<Record<string, OrderDetail>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    if (!savedOrders.length) return;
    setRefreshing(true);
    const results = await Promise.allSettled(savedOrders.map((order) => fetchOrder(apiBaseUrl, order.trackingToken)));
    const nextDetails: Record<string, OrderDetail> = {};
    const nextErrors: Record<string, string> = {};
    results.forEach((result, index) => {
      const token = savedOrders[index].trackingToken;
      if (result.status === 'fulfilled') nextDetails[token] = result.value;
      else nextErrors[token] = result.reason instanceof Error ? result.reason.message : 'Order status is unavailable.';
    });
    setDetails(nextDetails); setErrors(nextErrors); setRefreshing(false);
  }, [apiBaseUrl, savedOrders]);

  useEffect(() => {
    const task = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(task);
  }, [refresh]);

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.action} />}>
      <Eyebrow>Made-to-order progress</Eyebrow><Title>Your orders</Title><Body muted>Pull to refresh payment, production, and delivery updates verified by the store.</Body>
      {!savedOrders.length ? <EmptyState title="No orders saved" message="Orders created on this device appear here with their verified status." action={<Button label="Browse the shop" onPress={() => router.navigate('/shop')} />} /> : null}
      {savedOrders.map((saved) => {
        const order = details[saved.trackingToken];
        const error = errors[saved.trackingToken];
        return <Card key={saved.trackingToken} style={error ? styles.failed : undefined}>
          <View style={styles.header}><View style={styles.headerCopy}><Text style={styles.number}>{order?.orderNumber ?? saved.orderNumber}</Text><Text style={styles.date}>{new Date(order?.createdAt ?? saved.createdAt).toLocaleDateString()}</Text></View><Pill tone={order?.paymentStatus === 'paid' ? 'mint' : 'neutral'}>{pretty(order?.paymentStatus ?? saved.paymentStatus)}</Pill></View>
          <View style={styles.totalRow}><Text style={styles.status}>{pretty(order?.status ?? saved.status)}</Text><Text style={styles.total}>{formatMoney(order?.amounts.totalCents ?? saved.amounts.totalCents, order?.amounts.currency ?? saved.amounts.currency)}</Text></View>
          {order?.items.map((item) => <View key={item.id} style={styles.item}><Text style={styles.itemName}>{item.quantity} × {item.name}</Text><Text style={styles.itemPrice}>{formatMoney(item.lineTotalCents, order.amounts.currency)}</Text></View>)}
          {order?.timeline.length ? <View style={styles.timeline}>{order.timeline.map((event, index) => <View key={`${event.status}-${event.createdAt}-${index}`} style={styles.event}><View style={styles.dot} /><View style={styles.eventCopy}><Text style={styles.eventTitle}>{pretty(event.status)}</Text>{event.note ? <Body muted>{event.note}</Body> : null}<Text style={styles.eventDate}>{new Date(event.createdAt).toLocaleString()}</Text></View></View>)}</View> : null}
          {error ? <><Text accessibilityRole="alert" style={styles.error}>{error}</Text><Body muted>This saved reference may be expired, removed, or the store may be temporarily unavailable.</Body><Button label="Retry" variant="secondary" compact onPress={() => void refresh()} /><Button label="Forget this order" variant="ghost" compact onPress={() => removeSavedOrder(saved.trackingToken)} /></> : null}
        </Card>;
      })}
    </Screen>
  );
}

function pretty(value: string) { return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()); }

const styles = StyleSheet.create({
  failed: { borderColor: colors.danger }, header: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, alignItems: 'flex-start' }, headerCopy: { flex: 1, gap: 2 }, number: { color: colors.ink, fontSize: 18, fontWeight: '900' }, date: { color: colors.muted, fontSize: 12 }, totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: spacing.md }, status: { color: colors.actionDark, fontWeight: '900' }, total: { color: colors.ink, fontSize: 24, fontWeight: '900' }, item: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing.sm }, itemName: { color: colors.text, flex: 1 }, itemPrice: { color: colors.ink, fontWeight: '800' }, timeline: { gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing.md }, event: { flexDirection: 'row', gap: spacing.sm }, dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.action, marginTop: 6 }, eventCopy: { flex: 1 }, eventTitle: { color: colors.ink, fontWeight: '900' }, eventDate: { color: colors.muted, fontSize: 11, marginTop: 3 }, error: { color: colors.danger, fontWeight: '800' },
});
