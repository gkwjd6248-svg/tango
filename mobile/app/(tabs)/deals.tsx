import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Linking,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDealsStore } from '../../src/store/useDealsStore';
import { Deal } from '../../src/api/deals';

interface Category {
  key: string;
  labelKey: string;
}

const CATEGORIES: Category[] = [
  { key: 'all', labelKey: 'allCategories' },
  { key: 'shoes', labelKey: 'shoes' },
  { key: 'clothing', labelKey: 'clothing' },
  { key: 'accessories', labelKey: 'accessories' },
  { key: 'music', labelKey: 'music' },
];

function DealCard({ deal }: { deal: Deal }) {
  const { t } = useTranslation();

  const handlePress = async () => {
    const supported = await Linking.canOpenURL(deal.affiliateUrl);
    if (supported) {
      await Linking.openURL(deal.affiliateUrl);
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.8}
      accessibilityRole="link"
      accessibilityLabel={deal.title}
    >
      {deal.imageUrl ? (
        <Image
          source={{ uri: deal.imageUrl }}
          style={styles.cardImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.cardImagePlaceholder}>
          <Text style={styles.cardImagePlaceholderText}>
            {deal.category.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      {deal.discountPercentage > 0 && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>-{deal.discountPercentage}%</Text>
        </View>
      )}

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {deal.title}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.dealPrice}>
            {deal.currency} {deal.dealPrice.toFixed(0)}
          </Text>
          {deal.originalPrice > deal.dealPrice && (
            <Text style={styles.originalPrice}>
              {deal.originalPrice.toFixed(0)}
            </Text>
          )}
        </View>
        <Text style={styles.provider}>{deal.provider}</Text>
        <View style={styles.viewDealBtn}>
          <Text style={styles.viewDealText}>{t('viewDeal')}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function DealsScreen() {
  const { t } = useTranslation();
  const { deals, isLoading, error, selectedCategory, fetchDeals, loadMore, setCategory } =
    useDealsStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDeals();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDeals();
    setRefreshing(false);
  };

  const renderFooter = () => {
    if (!isLoading || deals.length === 0) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#8B0000" />
      </View>
    );
  };

  if (isLoading && deals.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  if (error && deals.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchDeals}>
          <Text style={styles.retryBtnText}>{t('retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Category filter chips */}
      <View style={styles.categoryWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.categoryBtn,
                selectedCategory === cat.key && styles.categoryBtnActive,
              ]}
              onPress={() => setCategory(cat.key)}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === cat.key && styles.categoryTextActive,
                ]}
              >
                {t(cat.labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={deals}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <DealCard deal={item} />}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.columnWrapper}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#8B0000']}
            tintColor="#8B0000"
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('noDeals')}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  categoryWrapper: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryRow: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  categoryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  categoryBtnActive: { backgroundColor: '#8B0000' },
  categoryText: { fontSize: 14, color: '#333', fontWeight: '500' },
  categoryTextActive: { color: '#fff' },
  list: { padding: 8 },
  columnWrapper: { justifyContent: 'space-between' },
  card: {
    flex: 1,
    margin: 6,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardImage: { width: '100%', height: 120 },
  cardImagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#FFF8E7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImagePlaceholderText: {
    fontSize: 36,
    color: '#DAA520',
    fontWeight: 'bold',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#8B0000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  cardBody: { padding: 10 },
  cardTitle: { fontSize: 13, color: '#333', marginBottom: 6, lineHeight: 18 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  dealPrice: { fontSize: 15, fontWeight: 'bold', color: '#8B0000' },
  originalPrice: {
    fontSize: 11,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  provider: { fontSize: 11, color: '#999', marginBottom: 8 },
  viewDealBtn: {
    backgroundColor: '#8B0000',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewDealText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: { fontSize: 16, color: '#666', marginTop: 12 },
  errorText: {
    fontSize: 16,
    color: '#8B0000',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: '#8B0000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: { fontSize: 18, color: '#666', fontWeight: '600' },
  footer: { paddingVertical: 16, alignItems: 'center' },
});
