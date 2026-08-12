import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Body, Button, Card, Eyebrow, Field, Pill, ProductVisual, Title } from '@/components/ui';
import { colors, radius, shadow, spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { formatMoney } from '@/lib/api';

export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { products, addToCart } = useApp();
  const product = products.find((entry) => entry.slug === slug);
  const [color, setColor] = useState('');
  const [material, setMaterial] = useState('');
  const [personalization, setPersonalization] = useState('');
  const [notes, setNotes] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [uploadUri, setUploadUri] = useState('');
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [quantity, setQuantity] = useState(product?.minimumQuantity ?? 1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const needsUpload = Boolean(product?.personalization?.some((type) => type === 'photo' || type === 'logo'));
  const uploadLabel = product?.personalization?.includes('photo') ? 'Choose photo' : 'Choose logo or artwork';
  const personalizationLabel = useMemo(() => {
    if (product?.personalization?.includes('coordinates')) return 'Coordinates, date, and wording';
    if (product?.personalization?.includes('text')) return 'Personalization text';
    return 'Customization details';
  }, [product]);

  if (!product) {
    return (
      <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
        <View style={styles.missing}><Title>Product unavailable</Title><Body>This item is no longer in the current catalog.</Body><Button label="Back to shop" onPress={() => router.replace('/shop')} /></View>
      </SafeAreaView>
    );
  }

  const selectedColor = color || product.colors?.[0];
  const selectedMaterial = material || product.materials?.[0] || product.material;
  const optionsRequired = Boolean(product.personalization?.length);
  const canAdd = !needsUpload || (Boolean(uploadName) && rightsConfirmed);

  async function pickUpload() {
    setError('');
    const result = await DocumentPicker.getDocumentAsync({ type: 'image/*', copyToCacheDirectory: true, multiple: false });
    if (result.canceled) return;
    const asset = result.assets[0];
    if ((asset.size ?? 0) > 15 * 1024 * 1024) { setError('Choose an image that is 15 MB or smaller.'); return; }
    setUploadName(asset.name);
    setUploadUri(asset.uri);
    setRightsConfirmed(false);
  }

  function addItem() {
    if (!canAdd) { setError('Choose your image and confirm you have permission to use it.'); return; }
    addToCart(product!, {
      color: selectedColor,
      material: selectedMaterial,
      personalization: personalization.trim() || undefined,
      uploadName: uploadName || undefined,
      notes: notes.trim() || undefined,
    }, quantity);
    setMessage(`${product!.name} added to your cart.`);
    setError('');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: product.name }} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={88}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}>
          <View style={styles.visualWrap}><ProductVisual product={product} height={280} /></View>
          <View style={styles.badgeRow}>{product.badge ? <Pill tone={product.badge === 'Best Seller' ? 'orange' : 'mint'}>{product.badge}</Pill> : null}<Pill tone="neutral">{product.category}</Pill></View>
          <Title>{product.name}</Title>
          <View style={styles.priceRow}><Text style={styles.price}>{formatMoney(product.price.amountCents, product.price.currency)}</Text><Text style={styles.lead}>{product.leadTimeDays.min}–{product.leadTimeDays.max} business days</Text></View>
          <Body>{product.description}</Body>

          {product.colors?.length ? <OptionGroup label="Color"><View style={styles.choices}>{product.colors.map((value) => <Choice key={value} label={value} selected={selectedColor === value} onPress={() => setColor(value)} />)}</View></OptionGroup> : null}
          {product.materials?.length && product.materials.length > 1 ? <OptionGroup label="Material"><View style={styles.choices}>{product.materials.map((value) => <Choice key={value} label={value} selected={selectedMaterial === value} onPress={() => setMaterial(value)} />)}</View></OptionGroup> : null}

          {optionsRequired ? (
            <Card style={styles.customCard}>
              <Eyebrow>Make it yours</Eyebrow>
              {needsUpload ? (
                <>
                  <Text style={styles.optionLabel}>{product.personalization?.includes('photo') ? 'Photo' : 'Approved artwork'}</Text>
                  <Button label={uploadName ? 'Choose a different file' : uploadLabel} variant="secondary" onPress={() => void pickUpload()} />
                  {uploadUri ? <Image source={{ uri: uploadUri }} style={styles.uploadPreview} contentFit="cover" accessibilityLabel="Selected personalization image preview" /> : null}
                  {uploadName ? <Pill>{uploadName}</Pill> : <Body muted>JPG, PNG, HEIC, or another image format · up to 15 MB</Body>}
                  <View style={styles.rightsRow}>
                    <Switch accessibilityLabel="Confirm image rights" value={rightsConfirmed} onValueChange={setRightsConfirmed} trackColor={{ false: colors.line, true: colors.forest }} />
                    <Text style={styles.rightsText}>I own this image or have permission to use it for this product.</Text>
                  </View>
                </>
              ) : null}
              <Field
                label={personalizationLabel}
                value={personalization}
                onChangeText={setPersonalization}
                maxLength={80}
                placeholder={product.personalization?.includes('coordinates') ? '37.7749° N, 122.4194° W · 06.14.24' : 'Enter name, date, or short wording'}
                hint={`${personalization.length}/80 characters. A person confirms layout before production.`}
              />
              <Field label="Notes (optional)" value={notes} onChangeText={setNotes} maxLength={240} multiline placeholder="Add layout, color, or gift notes" style={styles.notesInput} />
            </Card>
          ) : null}

          <OptionGroup label="Quantity">
            <View style={styles.counter}>
              <Button label="−" variant="secondary" compact disabled={quantity <= (product.minimumQuantity ?? 1)} onPress={() => setQuantity((value) => Math.max(product.minimumQuantity ?? 1, value - 1))} />
              <Text accessibilityLabel={`Quantity ${quantity}`} style={styles.quantity}>{quantity}</Text>
              <Button label="+" variant="secondary" compact disabled={quantity >= 100} onPress={() => setQuantity((value) => Math.min(100, value + 1))} />
            </View>
            {product.minimumQuantity ? <Body muted>Minimum quantity: {product.minimumQuantity}</Body> : null}
          </OptionGroup>

          <Card>
            <Text style={styles.cardHeading}>Product details</Text>
            <Detail label="Material" value={selectedMaterial} />
            <Detail label="Production" value={`${product.leadTimeDays.min}–${product.leadTimeDays.max} business days`} />
            {product.printTimeHours ? <Detail label="Typical print" value={`${product.printTimeHours.min}–${product.printTimeHours.max} hours`} /> : null}
            <Detail label="Dimensions" value={product.dimensions ?? 'See final proof'} />
          </Card>
          <Card>
            <Text style={styles.cardHeading}>What’s included</Text>
            {(product.includedItems ?? ['Selected printed product', 'Care card']).map((item) => <Text key={item} style={styles.bullet}>• {item}</Text>)}
          </Card>
          <Card>
            <Text style={styles.cardHeading}>Care & safety</Text>
            {[...(product.careInstructions ?? []), ...(product.safetyWarnings ?? [])].map((item) => <Text key={item} style={styles.bullet}>• {item}</Text>)}
          </Card>
          {message ? <Text accessibilityRole="alert" style={styles.success}>{message}</Text> : null}
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          <View style={styles.scrollSpacer} />
        </ScrollView>
        <View style={styles.sticky}>
          <View><Text style={styles.stickyLabel}>Total</Text><Text style={styles.stickyPrice}>{formatMoney(product.price.amountCents * quantity)}</Text></View>
          <View style={styles.stickyButton}><Button label={optionsRequired ? 'Add customized item' : 'Add to cart'} disabled={!canAdd} onPress={addItem} /></View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function OptionGroup({ label, children }: React.PropsWithChildren<{ label: string }>) {
  return <Card><Text style={styles.optionLabel}>{label}</Text>{children}</Card>;
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.choice, selected && styles.choiceSelected]}><Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text></Pressable>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <View style={styles.detail}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream }, flex: { flex: 1 },
  missing: { padding: spacing.lg, gap: spacing.md },
  content: { padding: spacing.md, gap: spacing.md },
  visualWrap: { borderRadius: radius.lg, overflow: 'hidden', ...shadow },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: spacing.md },
  price: { color: colors.ink, fontSize: 29, fontWeight: '900' }, lead: { flex: 1, textAlign: 'right', color: colors.muted, fontSize: 13, fontWeight: '700' },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { minHeight: 44, paddingHorizontal: 14, justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  choiceSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  choiceText: { color: colors.text, fontWeight: '800' }, choiceTextSelected: { color: colors.white },
  optionLabel: { color: colors.ink, fontSize: 16, fontWeight: '900' },
  customCard: { backgroundColor: colors.mintPale, borderColor: colors.forest, gap: spacing.md },
  rightsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }, rightsText: { color: colors.text, flex: 1, lineHeight: 20 },
  uploadPreview: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.sm, backgroundColor: colors.paper },
  notesInput: { minHeight: 92, paddingTop: 13, textAlignVertical: 'top' },
  counter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  quantity: { minWidth: 48, textAlign: 'center', color: colors.ink, fontSize: 27, fontWeight: '900' },
  cardHeading: { color: colors.ink, fontSize: 20, fontWeight: '900' },
  detail: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md, paddingVertical: 3 },
  detailLabel: { flex: 1, color: colors.muted }, detailValue: { flex: 2, color: colors.ink, fontWeight: '800', textAlign: 'right' },
  bullet: { color: colors.text, lineHeight: 21 }, success: { color: colors.success, fontWeight: '800' }, error: { color: colors.danger, fontWeight: '800' },
  scrollSpacer: { height: 8 },
  sticky: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.paper, borderTopWidth: 1, borderTopColor: colors.line, padding: 12, ...shadow },
  stickyLabel: { color: colors.muted, fontSize: 11, fontWeight: '800' }, stickyPrice: { color: colors.ink, fontSize: 20, fontWeight: '900' }, stickyButton: { flex: 1 },
});
