import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProductCard } from '@/components/product-card';
import { Body, Button, Card, Eyebrow, Pill, Screen, Title } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { formatMoney, requestQuote } from '@/lib/api';
import type { MaterialKey, QualityKey, QuoteEstimate } from '@/lib/types';

type SelectedFile = { uri: string; name: string; mimeType?: string | null; size?: number };
type Mode = 'products' | 'stl';
const materials: MaterialKey[] = ['pla', 'petg', 'abs'];
const qualities: QualityKey[] = ['draft', 'standard', 'fine'];
const stlMimeTypes = ['model/stl', 'application/sla', 'application/vnd.ms-pki.stl', 'application/octet-stream'];

export default function CustomizeScreen() {
  const { products } = useApp();
  const [mode, setMode] = useState<Mode>('products');
  const customProducts = useMemo(() => products.filter((product) => product.personalization?.length || product.productType === 'personalized').slice(0, 8), [products]);

  return (
    <Screen>
      <Eyebrow>Your idea, made tangible</Eyebrow>
      <Title>Customize it.</Title>
      <Body>Personalize a proven design or upload your own STL for a server-verified estimate.</Body>
      <View accessibilityRole="tablist" style={styles.segment}>
        <Segment label="Personalize" selected={mode === 'products'} onPress={() => setMode('products')} />
        <Segment label="Upload STL" selected={mode === 'stl'} onPress={() => setMode('stl')} />
      </View>
      {mode === 'products' ? <Personalize products={customProducts} /> : <StlQuote />}
    </Screen>
  );
}

function Segment({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="tab" accessibilityState={{ selected }} onPress={onPress} style={[styles.segmentButton, selected && styles.segmentSelected]}><Text style={[styles.segmentLabel, selected && styles.segmentLabelSelected]}>{label}</Text></Pressable>;
}

function Personalize({ products }: { products: ReturnType<typeof useApp>['products'] }) {
  return (
    <>
      <Card style={styles.steps}>
        <Text style={styles.cardTitle}>A clear, private workflow</Text>
        <MiniStep number="1" text="Choose a product and its color or material." />
        <MiniStep number="2" text="Enter a name, note, date, or select a file from the system picker." />
        <MiniStep number="3" text="Review the exact selections saved with your cart item." />
        <Body muted>Selected files remain local in this preview and are not uploaded during cart building.</Body>
      </Card>
      <View style={styles.grid}>{products.map((product) => <ProductCard key={product.id} product={product} compact />)}</View>
      <Button label="Browse every personalized product" variant="secondary" onPress={() => router.push({ pathname: '/shop', params: { category: 'Gifts & Personalization' } })} />
    </>
  );
}

function MiniStep({ number, text }: { number: string; text: string }) {
  return <View style={styles.miniStep}><View style={styles.miniNumber}><Text style={styles.miniNumberText}>{number}</Text></View><Text style={styles.miniText}>{text}</Text></View>;
}

function StlQuote() {
  const { apiBaseUrl } = useApp();
  const [file, setFile] = useState<SelectedFile | null>(null);
  const [material, setMaterial] = useState<MaterialKey>('pla');
  const [quality, setQuality] = useState<QualityKey>('standard');
  const [quantity, setQuantity] = useState(1);
  const [quote, setQuote] = useState<QuoteEstimate | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function chooseFile() {
    setError(''); setQuote(null);
    const result = await DocumentPicker.getDocumentAsync({
      type: stlMimeTypes,
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset.name.toLowerCase().endsWith('.stl')) { setError('Choose an STL file. OBJ and 3MF quoting is not available yet.'); return; }
    if ((asset.size ?? 0) > 25 * 1024 * 1024) { setError('The STL must be 25 MB or smaller.'); return; }
    setFile(asset);
  }

  async function calculate() {
    if (!file) return;
    setPending(true); setError(''); setQuote(null);
    try { setQuote(await requestQuote(apiBaseUrl, file, material, quality, quantity)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'We could not calculate this quote.'); }
    finally { setPending(false); }
  }

  return (
    <>
      <Card style={styles.privacy}>
        <Pill tone="mint">Server-verified</Pill>
        <Text style={styles.cardTitle}>Your file moves only when you ask.</Text>
        <Body muted>The document picker copies the STL to app cache. It is sent to your configured BayLayer server only when you tap Calculate estimate.</Body>
      </Card>
      <Card>
        <Text style={styles.label}>1 · STL file</Text>
        <Button label={file ? 'Choose a different STL' : 'Choose STL file'} variant="secondary" onPress={() => void chooseFile()} />
        {file ? <View style={styles.fileRow}><Pill>{file.name}</Pill><Text style={styles.fileSize}>{file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Size unavailable'}</Text></View> : <Body muted>Binary or ASCII STL · maximum 25 MB</Body>}
      </Card>
      <Card><Text style={styles.label}>2 · Material</Text><Choice values={materials} selected={material} onChange={setMaterial} /></Card>
      <Card><Text style={styles.label}>3 · Quality</Text><Choice values={qualities} selected={quality} onChange={setQuality} /></Card>
      <Card>
        <Text style={styles.label}>4 · Quantity</Text>
        <View style={styles.counter}>
          <Button label="−" variant="secondary" compact disabled={quantity === 1} onPress={() => setQuantity((value) => Math.max(1, value - 1))} />
          <Text accessibilityLabel={`Quantity ${quantity}`} style={styles.quantity}>{quantity}</Text>
          <Button label="+" variant="secondary" compact disabled={quantity === 100} onPress={() => setQuantity((value) => Math.min(100, value + 1))} />
        </View>
      </Card>
      {error ? <Card style={styles.errorCard}><Text accessibilityRole="alert" style={styles.errorText}>{error}</Text><Button label="Try again" variant="ghost" compact onPress={() => setError('')} /></Card> : null}
      <Button label="Calculate estimate" disabled={!file} loading={pending} onPress={() => void calculate()} />
      {quote ? <QuoteResult quote={quote} /> : null}
      <Card>
        <Text style={styles.cardTitle}>Before you upload</Text>
        <Body muted>We cannot accept weapons or firearm parts, medical devices, safety-critical vehicle parts, counterfeit items, or artwork you do not have permission to use.</Body>
      </Card>
    </>
  );
}

function Choice<T extends string>({ values, selected, onChange }: { values: T[]; selected: T; onChange: (value: T) => void }) {
  return <View style={styles.choices}>{values.map((value) => <Button key={value} compact label={value.toUpperCase()} variant={selected === value ? 'dark' : 'secondary'} onPress={() => onChange(value)} />)}</View>;
}

function QuoteResult({ quote }: { quote: QuoteEstimate }) {
  const dimensions = quote.geometry.dimensionsMm;
  return (
    <Card style={styles.result}>
      <Pill tone="mint">Estimate ready</Pill>
      <Text accessibilityRole="header" style={styles.total}>{formatMoney(quote.breakdown.totalCents, quote.currency)}</Text>
      <Body>{quote.estimateLabel}</Body>
      <View style={styles.rule} />
      <Detail label="Model" value={quote.geometry.fileName} />
      <Detail label="Size" value={`${dimensions.x.toFixed(1)} × ${dimensions.y.toFixed(1)} × ${dimensions.z.toFixed(1)} mm`} />
      <Detail label="Triangles" value={quote.geometry.triangleCount.toLocaleString()} />
      <Detail label="Material" value={`${quote.estimatedMaterialGrams.toFixed(1)} g`} />
      <Detail label="Machine time" value={`${quote.estimatedMachineHours.toFixed(1)} hr`} />
      <Detail label="Quantity" value={String(quote.selection.quantity)} />
      <View style={styles.rule} />
      <Body muted>Shipping and tax are excluded. A human printability review is required. Quote ID: {quote.quoteId}</Body>
      {[...quote.warnings, ...quote.geometry.warnings].map((warning) => <Text key={warning} style={styles.warning}>• {warning}</Text>)}
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <View style={styles.detail}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  segment: { minHeight: 52, flexDirection: 'row', padding: 4, backgroundColor: '#E7EFE8', borderRadius: radius.pill },
  segmentButton: { flex: 1, minHeight: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  segmentSelected: { backgroundColor: colors.ink },
  segmentLabel: { color: colors.text, fontWeight: '900' }, segmentLabelSelected: { color: colors.white },
  steps: { backgroundColor: colors.icePale, padding: spacing.lg },
  cardTitle: { color: colors.ink, fontSize: 20, lineHeight: 25, fontWeight: '900' },
  miniStep: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  miniNumber: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.action, alignItems: 'center', justifyContent: 'center' },
  miniNumberText: { color: colors.white, fontWeight: '900' }, miniText: { color: colors.text, flex: 1, lineHeight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', rowGap: spacing.md },
  privacy: { borderColor: colors.action, backgroundColor: colors.icePale },
  label: { color: colors.ink, fontSize: 16, fontWeight: '900' },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  fileRow: { gap: spacing.sm }, fileSize: { color: colors.muted, fontSize: 12 },
  counter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  quantity: { minWidth: 40, textAlign: 'center', color: colors.ink, fontSize: 28, fontWeight: '900' },
  errorCard: { borderColor: colors.danger, backgroundColor: '#FFF1EE' }, errorText: { color: colors.danger, fontWeight: '700', lineHeight: 21 },
  result: { backgroundColor: colors.icePale, borderColor: colors.action }, total: { color: colors.ink, fontSize: 38, fontWeight: '900' },
  rule: { height: 1, backgroundColor: colors.line, marginVertical: spacing.sm },
  detail: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  detailLabel: { color: colors.muted, flex: 1 }, detailValue: { color: colors.ink, fontWeight: '800', flex: 2, textAlign: 'right' },
  warning: { color: colors.actionDark, lineHeight: 20 },
});
