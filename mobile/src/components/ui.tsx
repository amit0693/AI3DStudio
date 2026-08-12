import { Image } from 'expo-image';
import { PropsWithChildren, ReactNode } from 'react';
import {
  ActivityIndicator, Platform, Pressable, RefreshControlProps, ScrollView, StyleProp,
  StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, shadow, spacing, typography } from '@/constants/theme';
import { getProductImage } from '@/lib/product-assets';
import type { Product } from '@/lib/types';

export function Screen({ children, refreshControl, contentStyle }: PropsWithChildren<{ refreshControl?: ReactNode; contentStyle?: StyleProp<ViewStyle> }>) {
  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, contentStyle]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        refreshControl={refreshControl as React.ReactElement<RefreshControlProps> | undefined}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Eyebrow({ children, light = false }: PropsWithChildren<{ light?: boolean }>) {
  return <Text style={[styles.eyebrow, light && styles.eyebrowLight]}>{children}</Text>;
}

export function Title({ children, light = false }: PropsWithChildren<{ light?: boolean }>) {
  return <Text accessibilityRole="header" style={[styles.title, light && styles.titleLight]}>{children}</Text>;
}

export function SectionTitle({ children, action }: PropsWithChildren<{ action?: ReactNode }>) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>{children}</Text>
      {action}
    </View>
  );
}

export function Body({ children, muted = false, light = false, style }: PropsWithChildren<{ muted?: boolean; light?: boolean; style?: StyleProp<ViewStyle> | object }>) {
  return <Text style={[styles.body, muted && styles.muted, light && styles.bodyLight, style]}>{children}</Text>;
}

export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  label, onPress, disabled, variant = 'primary', loading = false, accessibilityHint, compact = false,
}: {
  label: string; onPress: () => void; disabled?: boolean; variant?: 'primary' | 'secondary' | 'ghost' | 'dark';
  loading?: boolean; accessibilityHint?: string; compact?: boolean;
}) {
  const unavailable = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: unavailable, busy: loading }}
      disabled={unavailable}
      hitSlop={compact ? 4 : 0}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button, styles[`button_${variant}`], compact && styles.buttonCompact,
        unavailable && styles.buttonDisabled, pressed && !unavailable && styles.pressed,
      ]}>
      {loading ? <ActivityIndicator color={variant === 'primary' || variant === 'dark' ? colors.white : colors.ink} /> : (
        <Text style={[styles.buttonLabel, (variant === 'secondary' || variant === 'ghost') && styles.buttonLabelDark]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Field({ label, hint, ...props }: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput accessibilityLabel={label} placeholderTextColor={colors.muted} style={styles.input} {...props} />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function Pill({ children, tone = 'mint' }: PropsWithChildren<{ tone?: 'mint' | 'orange' | 'neutral' | 'dark' }>) {
  return (
    <View style={[styles.pill, styles[`pill_${tone}`]]}>
      <Text style={[styles.pillText, tone === 'dark' && styles.pillTextLight]}>{children}</Text>
    </View>
  );
}

export function EmptyState({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  return (
    <Card style={styles.empty}>
      <View style={styles.emptyIcon} accessible={false}><View style={styles.emptyDot} /></View>
      <Text accessibilityRole="header" style={styles.emptyTitle}>{title}</Text>
      <Body muted style={styles.emptyMessage}>{message}</Body>
      {action}
    </Card>
  );
}

const categoryColors: Record<string, { background: string; object: string }> = {
  'Gifts & Personalization': { background: colors.clayPale, object: colors.clay },
  'Desk & Tech': { background: colors.ice, object: colors.action },
  'Home & Organization': { background: '#EAF0F8', object: '#3E5B7D' },
  'Plants & Decor': { background: '#EDF4FF', object: '#5D82B5' },
  'Gaming & Hobbies': { background: '#E7EEFF', object: '#315FAF' },
  Seasonal: { background: '#FFF4D8', object: '#B45E3F' },
  'Business & Events': { background: '#E1F1FF', object: colors.actionDark },
};

export function ProductVisual({ product, height = 180 }: { product: Product; height?: number }) {
  const palette = categoryColors[product.category] ?? categoryColors['Desk & Tech'];
  const localImage = getProductImage(product.id);
  if (localImage || product.imageUrl) {
    return (
      <View style={[styles.visual, { height, backgroundColor: palette.background }]}>
        <Image source={localImage ?? { uri: product.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={180} accessibilityLabel={`${product.name} product photo`} />
      </View>
    );
  }
  return (
    <View style={[styles.visual, { height, backgroundColor: palette.background }]} accessible={false}>
      <View style={[styles.visualHalo, { borderColor: palette.object }]} />
      <View style={[styles.visualTop, { backgroundColor: palette.object }]} />
      <View style={[styles.visualMiddle, { backgroundColor: colors.paper }]} />
      <View style={[styles.visualBase, { backgroundColor: colors.ink }]} />
      <Text numberOfLines={1} style={styles.visualSku}>{product.sku}</Text>
    </View>
  );
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return <View style={styles.loading}><ActivityIndicator color={colors.action} /><Text style={styles.hint}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ceramic },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 56, gap: spacing.md },
  eyebrow: { color: colors.actionDark, fontFamily: typography.label, fontSize: 11, fontWeight: '700', letterSpacing: 1.35, textTransform: 'uppercase' },
  eyebrowLight: { color: colors.ice },
  title: { color: colors.ink, fontFamily: typography.display, fontSize: 42, lineHeight: 44, fontWeight: '700', letterSpacing: -1.1 },
  titleLight: { color: colors.white },
  sectionTitleRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  sectionTitle: { color: colors.ink, fontFamily: typography.display, fontSize: 27, lineHeight: 31, fontWeight: '700', letterSpacing: -0.35 },
  body: { color: colors.text, fontFamily: typography.body, fontSize: 16, lineHeight: 24 },
  muted: { color: colors.muted },
  bodyLight: { color: '#E6EEF9' },
  card: { backgroundColor: colors.paper, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: spacing.md, gap: spacing.sm },
  button: { minHeight: 50, paddingHorizontal: spacing.md, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.action },
  buttonCompact: { minHeight: 44, paddingHorizontal: 14 },
  button_primary: { backgroundColor: colors.action, borderColor: colors.action },
  button_secondary: { backgroundColor: colors.icePale, borderColor: colors.action },
  button_ghost: { backgroundColor: 'transparent', borderColor: colors.line },
  button_dark: { backgroundColor: colors.ink, borderColor: colors.ink },
  buttonDisabled: { opacity: 0.45 },
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.88 },
  buttonLabel: { color: colors.white, fontFamily: typography.body, fontWeight: '800', fontSize: 15 },
  buttonLabelDark: { color: colors.ink },
  fieldWrap: { gap: 7 },
  label: { color: colors.ink, fontFamily: typography.body, fontSize: 14, fontWeight: '800' },
  input: { minHeight: 50, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, paddingHorizontal: 14, color: colors.text, fontFamily: typography.body, fontSize: 16, backgroundColor: colors.white },
  hint: { color: colors.muted, fontFamily: typography.body, fontSize: 12, lineHeight: 17 },
  pill: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  pill_mint: { backgroundColor: colors.ice },
  pill_orange: { backgroundColor: colors.clayPale },
  pill_neutral: { backgroundColor: '#E9EEF5' },
  pill_dark: { backgroundColor: colors.ink },
  pillText: { color: colors.ink, fontFamily: typography.label, fontWeight: '700', fontSize: 10 },
  pillTextLight: { color: colors.white },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, paddingHorizontal: spacing.lg, ...shadow },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.icePale, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  emptyDot: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.ice, transform: [{ rotate: '12deg' }] },
  emptyTitle: { color: colors.ink, fontFamily: typography.display, fontSize: 26, fontWeight: '700', textAlign: 'center' },
  emptyMessage: { textAlign: 'center' },
  visual: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  visualHalo: { position: 'absolute', width: 130, height: 130, borderRadius: 65, borderWidth: 1, opacity: 0.22 },
  visualTop: { width: 82, height: 48, borderRadius: 14, transform: [{ rotate: '-7deg' }], ...shadow },
  visualMiddle: { width: 112, height: 34, borderRadius: 10, marginTop: -8, borderWidth: 1, borderColor: colors.line },
  visualBase: { width: 142, height: 17, borderRadius: 8, marginTop: 7, opacity: 0.92 },
  visualSku: { position: 'absolute', right: 10, bottom: 8, color: colors.ink, fontFamily: typography.label, opacity: 0.55, fontWeight: '700', fontSize: 9, letterSpacing: 0.8 },
  loading: { padding: spacing.xl, gap: spacing.sm, alignItems: 'center' },
});
