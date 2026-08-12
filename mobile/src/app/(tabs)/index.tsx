import { router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ProductCard } from '@/components/product-card';
import { Body, Button, Card, Eyebrow, Pill, ProductVisual, Screen, SectionTitle, Title } from '@/components/ui';
import { colors, radius, shadow, spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { categories, fallbackProducts } from '@/lib/catalog';

const categoryNotes: Record<string, string> = {
  'Gifts & Personalization': 'Made from your photo, name, or story',
  'Desk & Tech': 'Calmer setups and smarter storage',
  'Home & Organization': 'A useful place for everyday things',
  'Plants & Decor': 'Sculptural forms made for real homes',
  'Gaming & Hobbies': 'Modular tools for the things you love',
  Seasonal: 'Small-batch pieces for the moment',
  'Business & Events': 'Displays, favors, and branded batches',
};

export default function HomeScreen() {
  const { products, catalogSource, catalogError, catalogLoading, refreshCatalog } = useApp();
  const hero = products.find((product) => product.id === 'PG-01') ?? fallbackProducts[0];
  const featured = products.filter((product) => product.featured).slice(0, 6);

  return (
    <Screen refreshControl={<RefreshControl refreshing={catalogLoading} onRefresh={() => void refreshCatalog()} tintColor={colors.orange} />}>
      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <Eyebrow light>Printed to order in the USA</Eyebrow>
          <Title light>Objects made for your story.</Title>
          <Body light>Personalized gifts and practical pieces, printed in small batches and checked by a real person.</Body>
          <View style={styles.heroButtons}>
            <Button label="Shop best sellers" onPress={() => router.navigate('/shop')} />
            <Button label="Create yours" variant="secondary" onPress={() => router.navigate('/customize')} />
          </View>
        </View>
        <View style={styles.heroImage}>
          <ProductVisual product={hero} height={230} />
          <View style={styles.heroCaption}><Pill tone="dark">Customer favorite</Pill><Text style={styles.heroProduct}>{hero.name}</Text></View>
        </View>
      </View>

      <View style={styles.benefits}>
        <Benefit number="01" title="Made to order" />
        <Benefit number="02" title="Personalized for you" />
        <Benefit number="03" title="Quality checked" />
      </View>

      {catalogError ? (
        <Card style={styles.notice}>
          <View style={styles.noticeRow}><Text style={styles.noticeTitle}>Browsing the offline catalog</Text><Pill tone="neutral">Offline</Pill></View>
          <Body muted>Your saved cart still works. Pull down or retry when you are connected.</Body>
          <Button label="Retry catalog" variant="ghost" compact onPress={() => void refreshCatalog()} />
        </Card>
      ) : <Pill tone={catalogSource === 'live' ? 'mint' : 'neutral'}>{catalogSource === 'live' ? 'Live inventory connected' : 'Catalog ready'}</Pill>}

      <SectionTitle action={<Pressable accessibilityRole="link" hitSlop={8} onPress={() => router.navigate('/shop')}><Text style={styles.link}>See all</Text></Pressable>}>Best sellers</SectionTitle>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
        {featured.map((product) => <View key={product.id} style={styles.carouselCard}><ProductCard product={product} /></View>)}
      </ScrollView>

      <SectionTitle>Shop by category</SectionTitle>
      <View style={styles.categoryGrid}>
        {categories.map((category, index) => (
          <Pressable
            key={category}
            accessibilityRole="link"
            accessibilityLabel={`Shop ${category}`}
            onPress={() => router.push({ pathname: '/shop', params: { category } })}
            style={({ pressed }) => [styles.category, index % 3 === 1 && styles.categoryMint, index % 3 === 2 && styles.categoryPeach, pressed && styles.pressed]}>
            <Text style={styles.categoryNumber}>0{index + 1}</Text>
            <Text style={styles.categoryTitle}>{category}</Text>
            <Text style={styles.categoryNote}>{categoryNotes[category]}</Text>
            <Text style={styles.categoryArrow}>→</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.how}>
        <Eyebrow light>How customization works</Eyebrow>
        <Text accessibilityRole="header" style={styles.howTitle}>From your idea to a finished object.</Text>
        <Step number="1" title="Choose or upload" text="Pick a customizable product, photo, name, logo, or STL file." />
        <Step number="2" title="Review the details" text="See options and estimates before anything moves to production." />
        <Step number="3" title="We print & check" text="Every small-batch order receives a hands-on quality check." />
        <Button label="Start customizing" onPress={() => router.navigate('/customize')} />
      </View>

      <Card style={styles.service}>
        <Eyebrow>Have your own model?</Eyebrow>
        <Text accessibilityRole="header" style={styles.serviceTitle}>Get a server-verified STL estimate.</Text>
        <Body muted>Your file is sent only when you tap Calculate estimate. No camera or photo-library permission is requested.</Body>
        <Button label="Upload an STL" variant="dark" onPress={() => router.navigate('/customize')} />
      </Card>
    </Screen>
  );
}

function Benefit({ number, title }: { number: string; title: string }) {
  return <View style={styles.benefit}><Text style={styles.benefitNumber}>{number}</Text><Text style={styles.benefitTitle}>{title}</Text></View>;
}

function Step({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{number}</Text></View>
      <View style={styles.stepCopy}><Text style={styles.stepTitle}>{title}</Text><Text style={styles.stepText}>{text}</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.ink, borderRadius: radius.lg, overflow: 'hidden' },
  heroCopy: { padding: spacing.lg, gap: spacing.md },
  heroButtons: { gap: spacing.sm },
  heroImage: { margin: 7, marginTop: 0, borderRadius: 22, overflow: 'hidden' },
  heroCaption: { position: 'absolute', left: 14, bottom: 14, gap: 6 },
  heroProduct: { maxWidth: 230, color: colors.white, fontSize: 17, fontWeight: '900', textShadowColor: '#00000099', textShadowRadius: 8 },
  benefits: { flexDirection: 'row', gap: spacing.sm },
  benefit: { flex: 1, minHeight: 104, backgroundColor: colors.paper, borderRadius: radius.sm, padding: 12, justifyContent: 'space-between', borderWidth: 1, borderColor: colors.line },
  benefitNumber: { color: colors.orangeDark, fontSize: 11, fontWeight: '900' },
  benefitTitle: { color: colors.ink, fontSize: 14, lineHeight: 18, fontWeight: '900' },
  notice: { borderLeftWidth: 4, borderLeftColor: colors.yellow },
  noticeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  noticeTitle: { color: colors.ink, fontWeight: '900', fontSize: 16, flex: 1 },
  link: { color: colors.orangeDark, fontWeight: '900', minHeight: 44, textAlignVertical: 'center' },
  carousel: { gap: spacing.md, paddingRight: spacing.md },
  carouselCard: { width: 286 },
  categoryGrid: { gap: spacing.sm },
  category: { minHeight: 146, backgroundColor: colors.sage, borderRadius: radius.md, padding: spacing.md, justifyContent: 'space-between', ...shadow },
  categoryMint: { backgroundColor: colors.mintPale },
  categoryPeach: { backgroundColor: colors.peach },
  categoryNumber: { color: colors.orangeDark, fontSize: 11, fontWeight: '900' },
  categoryTitle: { color: colors.ink, fontSize: 21, fontWeight: '900' },
  categoryNote: { color: colors.text, lineHeight: 20, maxWidth: '84%' },
  categoryArrow: { position: 'absolute', right: 18, bottom: 14, color: colors.ink, fontSize: 28, fontWeight: '700' },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  how: { backgroundColor: colors.forestDark, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  howTitle: { color: colors.white, fontSize: 27, lineHeight: 32, fontWeight: '900' },
  step: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { color: colors.white, fontWeight: '900' },
  stepCopy: { flex: 1, gap: 3 }, stepTitle: { color: colors.white, fontWeight: '900', fontSize: 16 }, stepText: { color: '#CFE6DF', lineHeight: 20 },
  service: { padding: spacing.lg, gap: spacing.md, backgroundColor: colors.paper },
  serviceTitle: { color: colors.ink, fontSize: 26, lineHeight: 31, fontWeight: '900' },
});
