import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Linking, RefreshControl, ActivityIndicator, ScrollView, Image,
} from 'react-native';
import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDealsStore } from '../../src/store/useDealsStore';
import { Deal } from '../../src/api/deals';
import { useTheme, Theme } from '../../src/theme/useTheme';

const CATEGORIES = [
  { key: 'all', labelKey: 'allCategories' },
  { key: 'shoes', labelKey: 'shoes' },
  { key: 'clothing', labelKey: 'clothing' },
  { key: 'accessories', labelKey: 'accessories' },
  { key: 'music', labelKey: 'music' },
];

function DealCard({ deal, colors }: { deal: Deal; colors: Theme }) {
  const { t } = useTranslation();
  const handlePress = async () => {
    const supported = await Linking.canOpenURL(deal.affiliateUrl);
    if (supported) await Linking.openURL(deal.affiliateUrl);
  };
  return (
    <TouchableOpacity style={[dStyles.card, { backgroundColor: colors.card }]} onPress={handlePress} activeOpacity={0.8}>
      {deal.imageUrl ? (
        <Image source={{ uri: deal.imageUrl }} style={dStyles.cardImage} resizeMode="cover" />
      ) : (
        <View style={[dStyles.cardImagePlaceholder, { backgroundColor: colors.surfaceSecondary }]}>
          <Text style={dStyles.cardImagePlaceholderText}>{deal.category.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      {deal.discountPercentage > 0 && (
        <View style={[dStyles.discountBadge, { backgroundColor: colors.primary }]}>
          <Text style={dStyles.discountText}>-{deal.discountPercentage}%</Text>
        </View>
      )}
      <View style={dStyles.cardBody}>
        <Text style={[dStyles.cardTitle, { color: colors.text }]} numberOfLines={2}>{deal.title}</Text>
        <View style={dStyles.priceRow}>
          <Text style={[dStyles.dealPrice, { color: colors.primary }]}>{deal.currency} {deal.dealPrice.toFixed(0)}</Text>
          {deal.originalPrice > deal.dealPrice && (
            <Text style={[dStyles.originalPrice, { color: colors.textTertiary }]}>{deal.originalPrice.toFixed(0)}</Text>
          )}
        </View>
        <Text style={[dStyles.provider, { color: colors.textTertiary }]}>{deal.provider}</Text>
        <View style={[dStyles.viewDealBtn, { backgroundColor: colors.primary }]}>
          <Text style={dStyles.viewDealText}>{t('viewDeal')}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const dStyles = StyleSheet.create({
  card: { flex: 1, margin: 6, borderRadius: 12, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardImage: { width: '100%', height: 120 },
  cardImagePlaceholder: { width: '100%', height: 120, justifyContent: 'center', alignItems: 'center' },
  cardImagePlaceholderText: { fontSize: 36, color: '#DAA520', fontWeight: 'bold' },
  discountBadge: { position: 'absolute', top: 8, right: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  discountText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  cardBody: { padding: 10 },
  cardTitle: { fontSize: 13, marginBottom: 6, lineHeight: 18 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  dealPrice: { fontSize: 15, fontWeight: 'bold' },
  originalPrice: { fontSize: 11, textDecorationLine: 'line-through' },
  provider: { fontSize: 11, marginBottom: 8 },
  viewDealBtn: { paddingVertical: 6, borderRadius: 6, alignItems: 'center' },
  viewDealText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});

export default function DealsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { deals, isLoading, error, selectedCategory, fetchDeals, loadMore, setCategory } = useDealsStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchDeals(); }, []);
  const onRefresh = async () => { setRefreshing(true); await fetchDeals(); setRefreshing(false); };

  if (isLoading && deals.length === 0) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.loadingText}>{t('loading')}</Text></View>;
  }

  if (error && deals.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchDeals}><Text style={styles.retryBtnText}>{t('retry')}</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.categoryWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity key={cat.key} style={[styles.categoryBtn, selectedCategory === cat.key && styles.categoryBtnActive]} onPress={() => setCategory(cat.key)}>
              <Text style={[styles.categoryText, selectedCategory === cat.key && styles.categoryTextActive]}>{t(cat.labelKey)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={deals} numColumns={2} keyExtractor={(item) => item.id}
        renderItem={({ item }) => <DealCard deal={item} colors={colors} />}
        contentContainerStyle={styles.list} columnWrapperStyle={styles.columnWrapper}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
        onEndReached={loadMore} onEndReachedThreshold={0.3}
        ListFooterComponent={isLoading && deals.length > 0 ? <View style={styles.footer}><ActivityIndicator size="small" color={colors.primary} /></View> : null}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>{t('noDeals')}</Text></View>}
      />
    </View>
  );
}

const createStyles = (c: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  categoryWrapper: { backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.border },
  categoryRow: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  categoryBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: c.surfaceSecondary },
  categoryBtnActive: { backgroundColor: c.primary },
  categoryText: { fontSize: 14, color: c.text, fontWeight: '500' },
  categoryTextActive: { color: '#fff' },
  list: { padding: 8 },
  columnWrapper: { justifyContent: 'space-between' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: c.background },
  loadingText: { fontSize: 16, color: c.textSecondary, marginTop: 12 },
  errorText: { fontSize: 16, color: c.primary, marginBottom: 16, textAlign: 'center' },
  retryBtn: { backgroundColor: c.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 18, color: c.textSecondary, fontWeight: '600' },
  footer: { paddingVertical: 16, alignItems: 'center' },
});
