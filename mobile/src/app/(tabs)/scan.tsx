import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { Body, Button, Card, Eyebrow, Field, Pill, Screen, Title } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { joinWaitlist } from '@/lib/api';

export default function ScanScreen() {
  const { apiBaseUrl } = useApp();
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit() {
    setPending(true); setError(''); setMessage('');
    try { const result = await joinWaitlist(apiBaseUrl, email.trim()); setMessage(result.message); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'We could not join the waitlist.'); }
    finally { setPending(false); }
  }

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  return (
    <Screen>
      <View style={styles.hero}>
        <Pill tone="orange">Coming soon</Pill>
        <View accessible={false} style={styles.camera}><View style={styles.lens} /></View>
        <Title>Scan an object. Make it printable.</Title>
        <Body>Our planned camera workflow will guide you around an object, build a model, check its dimensions, and estimate cost.</Body>
      </View>
      <Card>
        <Eyebrow>Not active in Phase 1</Eyebrow>
        <Text style={styles.heading}>What’s planned</Text>
        <Body>1. Capture from multiple angles{`\n`}2. AI-assisted mesh reconstruction{`\n`}3. Printability and scale checks{`\n`}4. Server-verified price estimate</Body>
        <Body muted>Camera access is not requested by this version of the app.</Body>
      </Card>
      <Card>
        <Text style={styles.heading}>Get early-access updates</Text>
        <Field
          label="Email address"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <View style={styles.consentRow}>
          <Switch accessibilityLabel="Consent to receive AI Scan launch emails" value={consent} onValueChange={setConsent} trackColor={{ false: colors.line, true: colors.forest }} />
          <Text style={styles.consent}>I agree to receive BayLayer Labs email updates about AI Scan. I can unsubscribe later.</Text>
        </View>
        <Button label="Join early access" loading={pending} disabled={!consent || !validEmail} onPress={() => void submit()} />
        {message ? <Text accessibilityRole="alert" style={styles.success}>{message}</Text> : null}
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: spacing.md, alignItems: 'flex-start' },
  camera: { alignSelf: 'stretch', height: 180, borderRadius: 24, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  lens: { width: 92, height: 92, borderRadius: 46, borderWidth: 14, borderColor: colors.mint, backgroundColor: colors.orange },
  heading: { color: colors.ink, fontSize: 21, fontWeight: '900' },
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }, consent: { color: colors.text, lineHeight: 20, flex: 1 },
  success: { color: colors.success, fontWeight: '800' }, error: { color: colors.danger, fontWeight: '700' },
});
