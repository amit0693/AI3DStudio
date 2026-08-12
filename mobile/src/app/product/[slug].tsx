import * as DocumentPicker from 'expo-document-picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Body, Button, Card, Eyebrow, Field, Pill, ProductVisual, Title } from '@/components/ui';
import { colors, radius, shadow, spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { formatMoney } from '@/lib/api';
import type { PersonalizationField, SelectedFile } from '@/lib/types';

export default function ProductDetailScreen() {
  const { slug, editKey } = useLocalSearchParams<{ slug: string; editKey?: string }>();
  const { products, cart, addToCart, updateCartItem } = useApp();
  const product = products.find((entry) => entry.slug === slug);
  const editing = cart.find((item) => item.key === editKey);
  const [color, setColor] = useState(editing?.options?.color ?? '');
  const [material, setMaterial] = useState(editing?.options?.material ?? '');
  const [values, setValues] = useState<Record<string, string>>(() => ({ ...(editing?.options?.values ?? {}) }));
  const [files, setFiles] = useState<Record<string, SelectedFile>>(() => ({ ...(editing?.options?.files ?? {}) }));
  const [rightsConfirmed, setRightsConfirmed] = useState(editing?.options?.rightsConfirmed ?? false);
  const [quantity, setQuantity] = useState(editing?.quantity ?? product?.minimumQuantity ?? 1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fields = useMemo(() => product?.personalization ?? [], [product]);
  const selectedColor = color || product?.colors?.[0];
  const selectedMaterial = material || product?.materials?.[0] || product?.material;
  const selectedFileCount = Object.keys(files).length;

  if (!product) {
    return <SafeAreaView style={styles.safe}><View style={styles.missing}><Title>Product unavailable</Title><Body>This item is no longer in the current catalog.</Body><Button label="Back to shop" onPress={() => router.replace('/shop')} /></View></SafeAreaView>;
  }

  function validationError() {
    for (const field of fields) {
      const value = values[field.key]?.trim();
      if (field.required && field.type === 'file' && !files[field.key]) return `${field.label} is required.`;
      if (field.required && field.type !== 'file' && !value) return `${field.label} is required.`;
      if (value && field.type === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${field.label} must use YYYY-MM-DD.`;
      if (value && field.type === 'url' && !/^https?:\/\/[^\s]+$/i.test(value)) return `${field.label} must be a complete http:// or https:// URL.`;
    }
    if (selectedFileCount && !rightsConfirmed) return 'Confirm you have permission to use the selected files.';
    return '';
  }

  async function pickFile(field: PersonalizationField) {
    setError('');
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if ((asset.size ?? 0) > 10 * 1024 * 1024) { setError('Choose a JPG, PNG, WebP, or PDF up to 10 MB.'); return; }
    setFiles((current) => ({ ...current, [field.key]: { uri: asset.uri, name: asset.name, mimeType: asset.mimeType } }));
    setRightsConfirmed(false);
  }

  function saveItem() {
    const problem = validationError();
    if (problem) { setError(problem); return; }
    const normalizedValues = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.trim()]).filter(([, value]) => value));
    const options = { color: selectedColor, material: selectedMaterial, values: normalizedValues, files, rightsConfirmed };
    if (editing && editKey) {
      updateCartItem(editKey, product!, options, quantity);
      router.replace('/cart');
      return;
    }
    addToCart(product!, options, quantity);
    setMessage(`${product!.name} added to your cart.`);
    setError('');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: editing ? `Edit ${product.name}` : product.name }} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={88}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}>
          <View style={styles.visualWrap}><ProductVisual product={product} height={280} /></View>
          <View style={styles.badgeRow}>{product.badge ? <Pill tone="mint">{product.badge}</Pill> : null}<Pill tone="neutral">{product.category}</Pill></View>
          <Title>{product.name}</Title>
          <View style={styles.priceRow}><Text style={styles.price}>{formatMoney(product.price.amountCents, product.price.currency)}</Text><Text style={styles.lead}>{product.leadTimeDays.min}–{product.leadTimeDays.max} business days</Text></View>
          <Body>{product.description}</Body>

          {product.colors?.length ? <OptionGroup label="Color"><View style={styles.choices}>{product.colors.map((value) => <Choice key={value} label={value} selected={selectedColor === value} onPress={() => setColor(value)} />)}</View></OptionGroup> : null}
          {product.materials && product.materials.length > 1 ? <OptionGroup label="Material"><View style={styles.choices}>{product.materials.map((value) => <Choice key={value} label={value} selected={selectedMaterial === value} onPress={() => setMaterial(value)} />)}</View></OptionGroup> : null}

          {fields.length ? <Card style={styles.customCard}><Eyebrow>Make it yours</Eyebrow>{fields.map((field) => (
            <SchemaField key={field.key} field={field} value={values[field.key] ?? ''} file={files[field.key]}
              onChange={(value) => setValues((current) => ({ ...current, [field.key]: value }))}
              onPick={() => void pickFile(field)}
              onRemove={() => setFiles((current) => { const next = { ...current }; delete next[field.key]; return next; })} />
          ))}{fields.some((field) => field.type === 'file') ? <View style={styles.rightsRow}><Switch accessibilityLabel="Confirm file rights" value={rightsConfirmed} onValueChange={setRightsConfirmed} trackColor={{ false: colors.line, true: colors.action }} /><Text style={styles.rightsText}>I own these files or have permission to use them for this product.</Text></View> : null}</Card> : null}

          <OptionGroup label="Quantity"><View style={styles.counter}><Button label="−" variant="secondary" compact disabled={quantity <= (product.minimumQuantity ?? 1)} onPress={() => setQuantity((value) => Math.max(product.minimumQuantity ?? 1, value - 1))} /><Text accessibilityLabel={`Quantity ${quantity}`} style={styles.quantity}>{quantity}</Text><Button label="+" variant="secondary" compact disabled={quantity >= 100} onPress={() => setQuantity((value) => Math.min(100, value + 1))} /></View>{(product.minimumQuantity ?? 1) > 1 ? <Body muted>Minimum quantity: {product.minimumQuantity}</Body> : null}</OptionGroup>

          <Card><Text style={styles.cardHeading}>Product details</Text><Detail label="Material" value={selectedMaterial ?? product.material} /><Detail label="Production" value={`${product.leadTimeDays.min}–${product.leadTimeDays.max} business days`} />{product.dimensions ? <Detail label="Dimensions" value={product.dimensions} /> : null}</Card>
          {product.safetyWarnings?.length ? <Card><Text style={styles.cardHeading}>Care & safety</Text>{[...(product.careInstructions ?? []), ...product.safetyWarnings].map((item) => <Text key={item} style={styles.bullet}>• {item}</Text>)}</Card> : null}
          {message ? <Text accessibilityRole="alert" style={styles.success}>{message}</Text> : null}{error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        </ScrollView>
        <View style={styles.sticky}><View><Text style={styles.stickyLabel}>Total</Text><Text style={styles.stickyPrice}>{formatMoney(product.price.amountCents * quantity)}</Text></View><View style={styles.stickyButton}><Button label={editing ? 'Save cart changes' : fields.length ? 'Add customized item' : 'Add to cart'} onPress={saveItem} /></View></View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SchemaField({ field, value, file, onChange, onPick, onRemove }: { field: PersonalizationField; value: string; file?: SelectedFile; onChange: (value: string) => void; onPick: () => void; onRemove: () => void }) {
  const label = `${field.label}${field.required ? ' *' : ''}`;
  if (field.type === 'select') return <View style={styles.fieldGroup}><Text style={styles.optionLabel}>{label}</Text><View style={styles.choices}>{field.options?.map((option) => <Choice key={option} label={option} selected={value === option} onPress={() => onChange(option)} />)}</View></View>;
  if (field.type === 'file') return <View style={styles.fieldGroup}><Text style={styles.optionLabel}>{label}</Text><Button label={file ? 'Choose a different file' : 'Choose file'} variant="secondary" onPress={onPick} />{file ? <View style={styles.fileRow}><Pill>{file.name}</Pill><Button label="Remove" variant="ghost" compact onPress={onRemove} /></View> : <Body muted>JPG, PNG, WebP, or PDF · up to 10 MB. Uploaded securely at checkout.</Body>}</View>;
  return <Field label={label} value={value} onChangeText={onChange} maxLength={field.maxLength} multiline={field.type === 'textarea'} autoCapitalize={field.type === 'url' ? 'none' : 'sentences'} autoCorrect={field.type !== 'url'} keyboardType={field.type === 'url' ? 'url' : 'default'} placeholder={field.placeholder ?? (field.type === 'date' ? 'YYYY-MM-DD' : field.type === 'url' ? 'https://example.com' : undefined)} style={field.type === 'textarea' ? styles.notesInput : undefined} />;
}

function OptionGroup({ label, children }: React.PropsWithChildren<{ label: string }>) { return <Card><Text style={styles.optionLabel}>{label}</Text>{children}</Card>; }
function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) { return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.choice, selected && styles.choiceSelected]}><Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text></Pressable>; }
function Detail({ label, value }: { label: string; value: string }) { return <View style={styles.detail}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>; }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ceramic }, flex: { flex: 1 }, missing: { padding: spacing.lg, gap: spacing.md }, content: { padding: spacing.md, gap: spacing.md },
  visualWrap: { borderRadius: radius.lg, overflow: 'hidden', ...shadow }, badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: spacing.md },
  price: { color: colors.ink, fontSize: 29, fontWeight: '900' }, lead: { flex: 1, textAlign: 'right', color: colors.muted, fontSize: 13, fontWeight: '700' }, choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { minHeight: 44, paddingHorizontal: 14, justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white }, choiceSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  choiceText: { color: colors.text, fontWeight: '800' }, choiceTextSelected: { color: colors.white }, optionLabel: { color: colors.ink, fontSize: 16, fontWeight: '900' }, customCard: { backgroundColor: colors.icePale, borderColor: colors.action, gap: spacing.md }, fieldGroup: { gap: spacing.sm },
  rightsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }, rightsText: { color: colors.text, flex: 1, lineHeight: 20 }, fileRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }, notesInput: { minHeight: 100, paddingTop: 13, textAlignVertical: 'top' },
  counter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg }, quantity: { minWidth: 48, textAlign: 'center', color: colors.ink, fontSize: 27, fontWeight: '900' }, cardHeading: { color: colors.ink, fontSize: 20, fontWeight: '900' },
  detail: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, paddingVertical: 3 }, detailLabel: { flex: 1, color: colors.muted }, detailValue: { flex: 2, color: colors.ink, fontWeight: '800', textAlign: 'right' }, bullet: { color: colors.text, lineHeight: 21 }, success: { color: colors.success, fontWeight: '800' }, error: { color: colors.danger, fontWeight: '800' },
  sticky: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.paper, borderTopWidth: 1, borderTopColor: colors.line, padding: 12, ...shadow }, stickyLabel: { color: colors.muted, fontSize: 11, fontWeight: '800' }, stickyPrice: { color: colors.ink, fontSize: 20, fontWeight: '900' }, stickyButton: { flex: 1 },
});
