import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Body, Button, Card, Eyebrow, Field, Screen, Title } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { authClient, fetchAuthConfig } from '@/lib/auth-client';

type AuthConfig = { enabled: boolean; google: boolean; emailOtp: boolean };

function messageFrom(error: unknown) {
  return error && typeof error === 'object' && 'message' in error
    ? String(error.message)
    : 'We could not complete sign-in. Please try again.';
}

export default function SignInScreen() {
  const session = authClient.useSession();
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    void fetchAuthConfig()
      .then(setConfig)
      .catch((error: unknown) => {
        // Sign-in degrades to unavailable when the config cannot be read.
        console.error('Auth configuration could not be loaded', error);
        setConfig({ enabled: false, google: false, emailOtp: false });
      });
  }, []);

  useEffect(() => {
    if (session.data) router.replace('/account');
  }, [session.data]);

  async function google() {
    setPending(true); setMessage('');
    try {
      const result = await authClient.signIn.social({ provider: 'google', callbackURL: '/account' });
      if (result.error) throw result.error;
    } catch (error) {
      setMessage(messageFrom(error)); setPending(false);
    }
  }

  async function sendCode() {
    setPending(true); setMessage('');
    try {
      const result = await authClient.emailOtp.sendVerificationOtp({ email: email.trim().toLowerCase(), type: 'sign-in' });
      if (result.error) throw result.error;
      setStep('code'); setMessage('We sent a 6-digit code to your email.');
    } catch (error) {
      setMessage(messageFrom(error));
    } finally {
      setPending(false);
    }
  }

  async function verify() {
    setPending(true); setMessage('');
    try {
      const result = await authClient.signIn.emailOtp({
        email: email.trim().toLowerCase(), otp, name: name.trim() || undefined,
      });
      if (result.error) throw result.error;
      router.replace('/account');
    } catch (error) {
      setMessage(messageFrom(error)); setPending(false);
    }
  }

  return (
    <Screen>
      <Eyebrow>Secure customer account</Eyebrow>
      <Title>Sign in to BayLayer Labs</Title>
      <Body muted>Use the same verified account on the app and website. No password required.</Body>
      <Card>
        {config?.google ? <Button label="Continue with Google" variant="secondary" loading={pending} onPress={() => void google()} /> : null}
        {config?.emailOtp && step === 'email' ? <>
          <Field label="Name (new accounts)" value={name} onChangeText={setName} autoComplete="name" />
          <Field label="Email address" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} autoComplete="email" keyboardType="email-address" />
          <Button label="Email me a code" loading={pending} disabled={!email.includes('@')} onPress={() => void sendCode()} />
        </> : null}
        {config?.emailOtp && step === 'code' ? <>
          <Text style={styles.destination}>Code sent to {email}</Text>
          <Field label="6-digit verification code" value={otp} onChangeText={(value) => setOtp(value.replace(/\D/g, '').slice(0, 6))} autoComplete="one-time-code" keyboardType="number-pad" maxLength={6} />
          <Button label="Verify and sign in" loading={pending} disabled={otp.length !== 6} onPress={() => void verify()} />
          <Button label="Use a different email" variant="ghost" onPress={() => { setStep('email'); setOtp(''); setMessage(''); }} />
        </> : null}
        {!config ? <Text style={styles.status}>Checking sign-in methods…</Text> : null}
        {config && !config.google && !config.emailOtp ? <Text accessibilityRole="alert" style={styles.warning}>The app is ready, but the site owner still needs to connect Google and email provider credentials.</Text> : null}
        {message ? <Text accessibilityRole="alert" style={styles.status}>{message}</Text> : null}
      </Card>
      <Body muted>By continuing, you agree to the Terms and acknowledge the Privacy Notice.</Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
  destination: { color: colors.ink, fontWeight: '800' },
  status: { color: colors.actionDark, lineHeight: 20 },
  warning: { backgroundColor: colors.sand, color: colors.ink, lineHeight: 20, padding: spacing.md },
});
