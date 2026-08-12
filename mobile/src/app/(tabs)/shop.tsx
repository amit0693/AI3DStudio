import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ProductCard } from '@/components/product-card';
import { Body, Button, Card, EmptyState, Eyebrow, Pill, Screen, Title } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { categories } from '@/lib/catalog';

type Sort = 'Featured' | 'Price ↑' | 'Price ↓' | 'Fastest';

export default function ShopScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const { products, catalogError, catalogLoading, refreshCatalog } = useApp();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(params.category ?? 'All');
  const [personalizedOnly, setPersonalizedOnly] = useState(false);
  const [material, setMaterial] = useState('All');
  const [maxPrice, setMaxPrice] = useState<'All' | 'Under $20' | 'Under $30'>('All');
  const [sort, setSort] = useState<Sort>('Featured');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch = !needle || `${product.name} ${product.shortDescription} ${product.category} ${product.material}`.toLowerCase().includes(needle);
      const matchesCategory = category === 'All' || product.category === category;
      const matchesPersonalization = !personalizedOnly || Boolean(product.personalization?.length) || product.productType === 'personalized';
      const matchesMaterial = material === 'All' || product.material.toUpperCase().includes(material.toUpperCase());
      const matchesPrice = maxPrice === 'All' || product.price.amountCents < (maxPrice === 'Under $20' ? 2000 : 3000);
      return matchesSearch && matchesCategory && matchesPersonalization && matchesMaterial && matchesPrice;
    }).sort((a, b) => {
      if (sort === 'Price ↑') return a.price.amountCents - b.price.amountCents;
      if (sort === 'Price ↓') return b.price.amountCents - a.price.amountCents;
      if (sort === 'Fastest') return a.leadTimeDays.min - b.leadTimeDays.min;
      return Number(b.featured) - Number(a.featured);
    });
  }, [products, search, category, personalizedOnly, material, maxPrice, sort]);

  function clearFilters() {
    setSearch(''); setCategory('All'); setPersonalizedOnly(false); setMaterial('All'); setMaxPrice('All'); setSort('Featured');
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={catalogLoading} onRefresh={() => void refreshCatalog()} tintColor={colors.action} />}>
      <Eyebrow>Small-batch catalog</Eyebrow>
      <Title>Find your next useful object.</Title>
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          accessibilityLabel="Search products"
          value={search}
          onChangeText={setSearch}
          placeholder="Search products, uses, materials…"
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          style={styles.search}
        />
        {search ? <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={8} onPress={() => setSearch('')} style={styles.clear}><Text style={styles.clearText}>×</Text></Pressable> : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {['All', ...categories].map((item) => <Chip key={item} label={item} selected={category === item} onPress={() => setCategory(item)} />)}
      </ScrollView>
      <View style={styles.controls}>
        <Button compact label={showFilters ? 'Hide filters' : 'Filters'} variant="secondary" onPress={() => setShowFilters((value) => !value)} />
        <Text accessibilityLiveRegion="polite" style={styles.resultCount}>{filtered.length} result{filtered.length === 1 ? '' : 's'}</Text>
      </View>
      {showFilters ? (
        <Card style={styles.filters}>
          <FilterRow label="Type" values={['All', 'Personalized']} selected={personalizedOnly ? 'Personalized' : 'All'} onSelect={(value) => setPersonalizedOnly(value === 'Personalized')} />
          <FilterRow label="Material" values={['All', 'PLA', 'PETG']} selected={material} onSelect={setMaterial} />
          <FilterRow label="Price" values={['All', 'Under $20', 'Under $30']} selected={maxPrice} onSelect={(value) => setMaxPrice(value as typeof maxPrice)} />
          <FilterRow label="Sort" values={['Featured', 'Price ↑', 'Price ↓', 'Fastest']} selected={sort} onSelect={(value) => setSort(value as Sort)} />
          <Button label="Clear all filters" variant="ghost" compact onPress={clearFilters} />
        </Card>
      ) : null}
      {catalogError ? <Card style={styles.offline}><Pill tone="neutral">Offline catalog</Pill><Body muted>Live availability could not be loaded. These products remain browseable and your cart stays on this device.</Body></Card> : null}
      {catalogLoading && !products.length ? <Card><Body muted>Loading the catalog…</Body></Card> : null}
      {filtered.length ? <View style={styles.grid}>{filtered.map((product) => <ProductCard key={product.id} product={product} compact />)}</View> : (
        <EmptyState title="No products match" message="Try another category or clear the current filters." action={<Button label="Clear filters" onPress={clearFilters} />} />
      )}
    </Screen>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}><Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text></Pressable>;
}

function FilterRow({ label, values, selected, onSelect }: { label: string; values: string[]; selected: string; onSelect: (value: string) => void }) {
  return <View style={styles.filterRow}><Text style={styles.filterLabel}>{label}</Text><View style={styles.filterChoices}>{values.map((value) => <Chip key={value} label={value} selected={selected === value} onPress={() => onSelect(value)} />)}</View></View>;
}

const styles = StyleSheet.create({
  searchWrap: { minHeight: 54, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14 },
  searchIcon: { color: colors.ink, fontSize: 25, fontWeight: '900', marginRight: 8 },
  search: { flex: 1, minHeight: 52, fontSize: 16, color: colors.text },
  clear: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, clearText: { color: colors.muted, fontSize: 27 },
  chips: { gap: 8, paddingRight: spacing.md },
  chip: { minHeight: 44, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  chipSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { color: colors.text, fontWeight: '800', fontSize: 13 }, chipTextSelected: { color: colors.white },
  controls: { minHeight: 48, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  resultCount: { color: colors.muted, fontSize: 13, fontWeight: '800' },
  filters: { gap: spacing.md },
  filterRow: { gap: 7 }, filterLabel: { color: colors.ink, fontWeight: '900' }, filterChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  offline: { borderLeftColor: colors.sand, borderLeftWidth: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', rowGap: spacing.md },
});
