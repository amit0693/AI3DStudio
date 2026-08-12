import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Platform, StyleSheet, Text } from 'react-native';

import { Body, Button, Card, Eyebrow, Field, Pill, Screen, Title } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { DEFAULT_API_BASE_URL, normalizeBaseUrl } from '@/lib/api';
import { authClient } from '@/lib/auth-client';

export default function SettingsScreen() {
  const session = authClient.useSession();
  const { apiBaseUrl, setApiBaseUrl, catalogSource } = useApp();
  const [draft, setDraft] = useState(apiBaseUrl);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    setError('');
    setSaved(false);
    const normalized = normalizeBaseUrl(draft);
    if (!/^https?:\/\/[^\s]+$/i.test(normalized)) {
      setError('Enter a complete http:// or https:// URL.');
      return;
    }
    await setApiBaseUrl(normalized);
    setDraft(normalized);
    setSaved(true);
  }

  const website = normalizeBaseUrl(apiBaseUrl);
  return (
    <Screen>
      <Eyebrow>Profile & preferences</Eyebrow>
      <Title>Settings</Title>
      <Card>
        <Text style={styles.heading}>Customer account</Text>
        <Body muted>{session.data ? `Signed in as ${session.data.user.email}.` : 'Sign in to use the same verified account across the app and website.'}</Body>
        <Button label={session.data ? 'Open account' : 'Sign in or create account'} onPress={() => router.push(session.data ? '/account' : '/sign-in')} />
      </Card>
      <Card>
        <Text style={styles.heading}>Store connection</Text>
        <Field
          label="API base URL"
          value={draft}
          onChangeText={(value) => { setDraft(value); setSaved(false); }}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          hint={Platform.OS === 'android'
            ? 'Android Emulator: use http://10.0.2.2:3000 for a server on this Mac. Physical devices need a LAN or reachable HTTPS URL.'
            : 'iOS Simulator can use localhost. Physical devices need a LAN or reachable HTTPS URL.'}
        />
        <Button label="Save and reconnect" onPress={() => void save()} />
        <Button label="Restore hosted URL" variant="ghost" onPress={() => setDraft(DEFAULT_API_BASE_URL)} />
        {saved ? <Text accessibilityRole="alert" style={styles.success}>Saved. The catalog is reconnecting.</Text> : null}
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <Pill tone={catalogSource === 'live' ? 'mint' : 'neutral'}>Catalog: {catalogSource}</Pill>
      </Card>
      <Card>
        <Text style={styles.heading}>Policies & support</Text>
        <Button label="Privacy policy" variant="secondary" onPress={() => void Linking.openURL(`${website}/privacy`)} />
        <Button label="Terms of service" variant="secondary" onPress={() => void Linking.openURL(`${website}/terms`)} />
        <Button label="3D print policy" variant="secondary" onPress={() => void Linking.openURL(`${website}/print-policy`)} />
        <Button label="Open BayLayer website" variant="ghost" onPress={() => void Linking.openURL(website)} />
      </Card>
      <Card>
        <Text style={styles.heading}>Privacy by default</Text>
        <Body muted>Cart, order references, and app settings stay on this device. Personalization files upload only when you start checkout, and STL files upload only when you request an estimate. Card details are entered only on Stripe’s hosted page.</Body>
        <Body muted>Version 1.1.0 · {Platform.OS === 'android' ? 'Android package' : 'iOS bundle'} com.baylayerlabs.mobile</Body>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { color: colors.ink, fontSize: 20, fontWeight: '900' },
  success: { color: colors.success, fontWeight: '800' },
  error: { color: colors.danger, fontWeight: '700' },
});
