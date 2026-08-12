import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Body, Button, Card, EmptyState, Eyebrow, Screen, SectionTitle, Title } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';

export default function OrdersScreen() {
  return (
    <Screen>
      <Eyebrow>Made-to-order progress</Eyebrow>
      <Title>Your orders</Title>
      <Body muted>Track production and delivery here after checkout is connected.</Body>
      <EmptyState
        title="No orders yet"
        message="This preview never invents order data or collects payment details. Products in your cart remain saved locally."
        action={<Button label="Browse the shop" onPress={() => router.navigate('/shop')} />}
      />
      <SectionTitle>What happens after you order</SectionTitle>
      <Card>
        <Timeline number="1" title="Details reviewed" text="We confirm personalization, scale, material, and printability." />
        <Timeline number="2" title="Printing & finishing" text="Your item is printed in a small batch, cleaned, and assembled if needed." />
        <Timeline number="3" title="Quality check" text="A person checks finish, fit, personalization, and packaging." />
        <Timeline number="4" title="Ready or shipped" text="Pickup or tracking information appears only after it is verified." last />
      </Card>
      <Card style={styles.help}>
        <Text accessibilityRole="header" style={styles.helpTitle}>Need help with an existing order?</Text>
        <Body muted>Use the confirmation email from your verified checkout. Order support is not connected to this preview app yet.</Body>
      </Card>
    </Screen>
  );
}

function Timeline({ number, title, text, last = false }: { number: string; title: string; text: string; last?: boolean }) {
  return (
    <View style={styles.timeline}>
      <View style={styles.markerWrap}><View style={styles.marker}><Text style={styles.markerText}>{number}</Text></View>{!last ? <View style={styles.line} /> : null}</View>
      <View style={styles.timelineCopy}><Text style={styles.timelineTitle}>{title}</Text><Body muted>{text}</Body></View>
    </View>
  );
}

const styles = StyleSheet.create({
  timeline: { flexDirection: 'row', gap: spacing.md },
  markerWrap: { alignItems: 'center', width: 36 },
  marker: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  markerText: { color: colors.ink, fontWeight: '900' },
  line: { width: 2, flex: 1, minHeight: 40, backgroundColor: colors.line },
  timelineCopy: { flex: 1, paddingBottom: spacing.md, gap: 3 },
  timelineTitle: { color: colors.ink, fontWeight: '900', fontSize: 16 },
  help: { backgroundColor: colors.mintPale },
  helpTitle: { color: colors.ink, fontSize: 20, fontWeight: '900' },
});
