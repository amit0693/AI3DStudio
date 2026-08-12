import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Body, Button, Card, Eyebrow, Pill, Screen, Title } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { formatMoney, requestQuote } from '@/lib/api';
import type { MaterialKey, QualityKey, QuoteEstimate } from '@/lib/types';

type SelectedFile = { uri: string; name: string; mimeType?: string | null; size?: number };
const materials: MaterialKey[] = ['pla', 'petg', 'abs'];
const qualities: QualityKey[] = ['draft', 'standard', 'fine'];
const stlMimeTypes = [
  'model/stl',
  'application/sla',
  'application/vnd.ms-pki.stl',
  'application/octet-stream',
];

function Choice<T extends string>({ values, selected, onChange }: { values: T[]; selected: T; onChange: (value: T) => void }) {
  return <View style={styles.choices}>{values.map((value) => <Button key={value} label={value.toUpperCase()} variant={selected === value ? 'primary' : 'secondary'} onPress={() => onChange(value)} />)}</View>;
}

export default function QuoteScreen() {
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
      // Android's Storage Access Framework reports STL files under several MIME
      // types depending on the document provider. The extension is rechecked
      // below and the server parses the bytes before quoting.
      type: stlMimeTypes, copyToCacheDirectory: true, multiple: false,
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
    <Screen>
      <Eyebrow>Server-verified estimate</Eyebrow>
      <Title>Quote an STL</Title>
      <Body>Choose your model and options. Geometry and pricing are recalculated by BayLayer’s server.</Body>
      <Card>
        <Text style={styles.label}>1 · STL file</Text>
        <Button label={file ? 'Choose a different STL' : 'Choose STL file'} variant="secondary" onPress={() => void chooseFile()} />
        {file ? <View style={styles.fileRow}><Pill>{file.name}</Pill><Text style={styles.fileSize}>{file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Size unavailable'}</Text></View> : <Body muted>Binary and ASCII STL · maximum 25 MB</Body>}
      </Card>
      <Card><Text style={styles.label}>2 · Material</Text><Choice values={materials} selected={material} onChange={setMaterial} /></Card>
      <Card><Text style={styles.label}>3 · Quality</Text><Choice values={qualities} selected={quality} onChange={setQuality} /></Card>
      <Card>
        <Text style={styles.label}>4 · Quantity</Text>
        <View style={styles.counter}>
          <Button label="−" variant="secondary" disabled={quantity === 1} onPress={() => setQuantity((value) => Math.max(1, value - 1))} />
          <Text accessibilityLabel={`Quantity ${quantity}`} style={styles.quantity}>{quantity}</Text>
          <Button label="+" variant="secondary" disabled={quantity === 100} onPress={() => setQuantity((value) => Math.min(100, value + 1))} />
        </View>
      </Card>
      {error ? <Card style={styles.error}><Text accessibilityRole="alert" style={styles.errorText}>{error}</Text></Card> : null}
      <Button label="Calculate estimate" disabled={!file} loading={pending} onPress={() => void calculate()} />
      {quote ? <QuoteResult quote={quote} /> : null}
    </Screen>
  );
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
      <Body muted>Shipping and tax are excluded. Every quote requires a human printability review before production. Quote ID: {quote.quoteId}</Body>
      {[...quote.warnings, ...quote.geometry.warnings].map((warning) => <Text key={warning} style={styles.warning}>• {warning}</Text>)}
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <View style={styles.detail}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  label: { color: colors.ink, fontSize: 16, fontWeight: '900' },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  fileRow: { gap: spacing.sm }, fileSize: { color: colors.muted, fontSize: 12 },
  counter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  quantity: { minWidth: 40, textAlign: 'center', color: colors.ink, fontSize: 28, fontWeight: '900' },
  error: { borderColor: colors.danger, backgroundColor: '#FFF1EE' }, errorText: { color: colors.danger, fontWeight: '700', lineHeight: 21 },
  result: { backgroundColor: colors.mintPale, borderColor: colors.forest }, total: { color: colors.ink, fontSize: 38, fontWeight: '900' },
  rule: { height: 1, backgroundColor: colors.line, marginVertical: spacing.sm },
  detail: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  detailLabel: { color: colors.muted, flex: 1 }, detailValue: { color: colors.ink, fontWeight: '800', flex: 2, textAlign: 'right' },
  warning: { color: colors.orangeDark, lineHeight: 20 },
});
