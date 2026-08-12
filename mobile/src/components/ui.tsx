import { PropsWithChildren, ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/constants/theme';

export function Screen({ children, refreshControl }: PropsWithChildren<{ refreshControl?: ReactNode }>) {
  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl as never}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Eyebrow({ children }: PropsWithChildren) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

export function Title({ children }: PropsWithChildren) {
  return <Text accessibilityRole="header" style={styles.title}>{children}</Text>;
}

export function Body({ children, muted = false, style }: PropsWithChildren<{ muted?: boolean; style?: object }>) {
  return <Text style={[styles.body, muted && styles.muted, style]}>{children}</Text>;
}

export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  label, onPress, disabled, variant = 'primary', loading = false, accessibilityHint,
}: {
  label: string; onPress: () => void; disabled?: boolean; variant?: 'primary' | 'secondary' | 'ghost'; loading?: boolean; accessibilityHint?: string;
}) {
  const unavailable = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: unavailable, busy: loading }}
      disabled={unavailable}
      onPress={onPress}
      style={({ pressed }) => [styles.button, styles[`button_${variant}`], unavailable && styles.buttonDisabled, pressed && !unavailable && styles.pressed]}>
      {loading ? <ActivityIndicator color={variant === 'primary' ? colors.white : colors.ink} /> : (
        <Text style={[styles.buttonLabel, variant !== 'primary' && styles.buttonLabelDark]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Field({ label, hint, ...props }: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        style={styles.input}
        {...props}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function Pill({ children, tone = 'mint' }: PropsWithChildren<{ tone?: 'mint' | 'orange' | 'neutral' }>) {
  return <View style={[styles.pill, styles[`pill_${tone}`]]}><Text style={styles.pillText}>{children}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 48, gap: spacing.md },
  eyebrow: { color: colors.orangeDark, fontSize: 12, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase' },
  title: { color: colors.ink, fontSize: 34, lineHeight: 38, fontWeight: '900', letterSpacing: -1 },
  body: { color: colors.text, fontSize: 16, lineHeight: 24 },
  muted: { color: colors.muted },
  card: { backgroundColor: colors.paper, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: spacing.md, gap: spacing.sm },
  button: { minHeight: 50, paddingHorizontal: spacing.md, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.ink },
  button_primary: { backgroundColor: colors.orange, borderColor: colors.orange },
  button_secondary: { backgroundColor: colors.mintPale },
  button_ghost: { backgroundColor: 'transparent' },
  buttonDisabled: { opacity: 0.5 },
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.88 },
  buttonLabel: { color: colors.white, fontWeight: '900', fontSize: 15 },
  buttonLabelDark: { color: colors.ink },
  fieldWrap: { gap: 6 },
  label: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  input: { minHeight: 50, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, paddingHorizontal: 14, color: colors.text, fontSize: 16, backgroundColor: colors.white },
  hint: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  pill: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  pill_mint: { backgroundColor: colors.mint },
  pill_orange: { backgroundColor: '#FFD8CA' },
  pill_neutral: { backgroundColor: '#E7EAE7' },
  pillText: { color: colors.ink, fontWeight: '800', fontSize: 12 },
});
