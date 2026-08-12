import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { Body, Button, Card, Eyebrow, Screen, Title } from '@/components/ui';
import { useApp } from '@/context/app-context';
import { fetchOrder } from '@/lib/api';

export default function CheckoutReturnScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const { apiBaseUrl, clearCart } = useApp();
  const [message, setMessage] = useState(token ? 'Checking the verified payment status…' : 'Open Orders and pull to refresh your saved order.');

  useEffect(() => {
    if (!token) return;
    let active = true;
    fetchOrder(apiBaseUrl, token)
      .then((order) => {
        if (!active) return;
        if (order.paymentStatus === 'paid') {
          clearCart();
          setMessage('Payment is verified. Your cart has been cleared and production review can begin.');
        } else {
          setMessage('Payment is not verified yet. Your cart is preserved; open Orders and pull to refresh.');
        }
      })
      .catch(() => active && setMessage('Status is temporarily unavailable. Your cart is preserved; open Orders and pull to refresh.'));
    return () => { active = false; };
  }, [apiBaseUrl, clearCart, token]);

  return <Screen><Eyebrow>Payment return</Eyebrow><Title>Check your order status.</Title><Card><Body>{message}</Body>{token ? <Body muted>Tracking reference: {token.slice(0, 10)}…</Body> : null}</Card><Button label="View orders" onPress={() => router.replace('/orders')} /><Button label="Continue shopping" variant="secondary" onPress={() => router.replace('/shop')} /></Screen>;
}
