import { router } from 'expo-router';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { Body, Button, Card, Eyebrow, LoadingState, Pill, Screen, Title } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { authClient } from '@/lib/auth-client';

export default function AccountScreen() {
  const session = authClient.useSession();

  if (session.isPending) return <Screen><LoadingState label="Loading your account…" /></Screen>;
  if (!session.data) return <Screen>
    <Eyebrow>Customer account</Eyebrow><Title>Keep every order together</Title>
    <Body muted>Sign in once to use the same verified account on this app and the BayLayer website.</Body>
    <Button label="Sign in or create account" onPress={() => router.replace('/sign-in')} />
  </Screen>;

  const user = session.data.user;
  return (
    <Screen>
      <Eyebrow>Verified customer account</Eyebrow>
      <Title>Hello, {user.name || user.email.split('@')[0]}</Title>
      <Card>
        <View style={styles.identity}>
          {user.image ? <Image source={{ uri: user.image }} style={styles.avatar} /> : <View style={styles.fallback}><Text style={styles.initial}>{(user.name || user.email)[0].toUpperCase()}</Text></View>}
          <View style={styles.identityCopy}><Text style={styles.name}>{user.name || 'BayLayer customer'}</Text><Text style={styles.email}>{user.email}</Text><Pill>Verified email</Pill></View>
        </View>
      </Card>
      <Card>
        <Text style={styles.heading}>Your orders</Text>
        <Body muted>Orders placed while signed in are attached to this account. This device also keeps local order references for quick status checks.</Body>
        <Button label="View order status" variant="secondary" onPress={() => router.navigate('/orders')} />
      </Card>
      <Button label="Sign out" variant="ghost" onPress={() => void authClient.signOut().then(() => router.replace('/sign-in'))} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 68, height: 68, borderRadius: radius.pill },
  fallback: { width: 68, height: 68, borderRadius: radius.pill, backgroundColor: colors.ice, alignItems: 'center', justifyContent: 'center' },
  initial: { color: colors.ink, fontSize: 28, fontWeight: '900' },
  identityCopy: { flex: 1, gap: 4 },
  name: { color: colors.ink, fontSize: 19, fontWeight: '900' },
  email: { color: colors.muted, fontSize: 13 },
  heading: { color: colors.ink, fontSize: 20, fontWeight: '900' },
});
