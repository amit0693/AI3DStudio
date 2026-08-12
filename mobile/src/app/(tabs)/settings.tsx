import { Linking, Platform, StyleSheet, Text } from 'react-native';
import { useState } from 'react';

import { Body, Button, Card, Eyebrow, Field, Pill, Screen, Title } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { DEFAULT_API_BASE_URL, normalizeBaseUrl } from '@/lib/api';

export default function SettingsScreen() {
  const { apiBaseUrl, setApiBaseUrl, catalogSource } = useApp();
  const [draft, setDraft] = useState(apiBaseUrl);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    setError(''); setSaved(false);
    const normalized = normalizeBaseUrl(draft);
    if (!/^https?:\/\/[^\s]+$/i.test(normalized)) { setError('Enter a complete http:// or https:// URL.'); return; }
    await setApiBaseUrl(normalized);
    setDraft(normalized); setSaved(true);
  }

  const website = normalizeBaseUrl(apiBaseUrl);
  return (
    <Screen>
      <Eyebrow>BayLayer Labs</Eyebrow>
      <Title>Settings</Title>
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
            ? 'Android Emulator: use http://10.0.2.2:3000 for a server on this Mac. A physical Android device needs your Mac’s LAN address on the same Wi-Fi or a reachable HTTPS URL.'
            : 'iOS Simulator: localhost can reach a server on this Mac. A physical iPhone needs your Mac’s LAN address on the same Wi-Fi or a reachable HTTPS URL.'}
        />
        <Button label="Save and reconnect" onPress={() => void save()} />
        <Button label="Restore hosted URL" variant="ghost" onPress={() => setDraft(DEFAULT_API_BASE_URL)} />
        {saved ? <Text accessibilityRole="alert" style={styles.success}>Saved. Catalog connection refreshed.</Text> : null}
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <Pill tone={catalogSource === 'live' ? 'mint' : 'neutral'}>Catalog: {catalogSource}</Pill>
      </Card>
      <Card>
        <Text style={styles.heading}>Policies and support</Text>
        <Button label="Privacy policy" variant="secondary" onPress={() => void Linking.openURL(`${website}/privacy`)} />
        <Button label="Terms of service" variant="secondary" onPress={() => void Linking.openURL(`${website}/terms`)} />
        <Button label="3D print policy" variant="secondary" onPress={() => void Linking.openURL(`${website}/print-policy`)} />
        <Button label="Open BayLayer website" variant="ghost" onPress={() => void Linking.openURL(website)} />
      </Card>
      <Card>
        <Text style={styles.heading}>Phase 1 preview</Text>
        <Body muted>Version 1.0.0 · {Platform.OS === 'android' ? 'Android package' : 'iOS bundle'} com.baylayerlabs.mobile</Body>
        <Body muted>Payments, production ordering, and camera scanning are not enabled. Never paste secrets or private access tokens into the API field.</Body>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { color: colors.ink, fontSize: 20, fontWeight: '900' },
  success: { color: colors.success, fontWeight: '800' }, error: { color: colors.danger, fontWeight: '700' },
});
