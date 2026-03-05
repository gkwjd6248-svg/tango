import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { PostCard } from '../../src/components/PostCard';
import { useCommunityStore } from '../../src/store/useCommunityStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useTheme, Theme } from '../../src/theme/useTheme';

type ScopeFilter = 'global' | 'country';

export default function CommunityScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { posts, isLoading, error, hasMore, fetchPosts, loadMore, setFilters } = useCommunityStore();
  const [filter, setFilter] = useState<ScopeFilter>('global');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchPosts(); }, []);

  const handleFilterChange = (newFilter: ScopeFilter) => {
    setFilter(newFilter);
    setFilters({ countryScope: newFilter === 'global' ? undefined : user?.countryCode });
  };

  const onRefresh = async () => { setRefreshing(true); await fetchPosts(); setRefreshing(false); };

  if (isLoading && posts.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  if (error && posts.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchPosts}>
          <Text style={styles.retryBtnText}>{t('retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {(['global', 'country'] as ScopeFilter[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterActive]}
            onPress={() => handleFilterChange(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'global' ? t('global') : t('myCountry')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={hasMore ? <View style={styles.footer}><ActivityIndicator size="small" color={colors.primary} /></View> : null}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('noPosts')}</Text>
            <Text style={styles.emptySubtext}>{t('beFirst')}</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/create-post')} accessibilityLabel={t('createPost')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (c: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  filterRow: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.border },
  filterButton: { paddingHorizontal: 20, paddingVertical: 8, backgroundColor: c.surfaceSecondary, borderRadius: 20 },
  filterActive: { backgroundColor: c.primary },
  filterText: { fontSize: 14, color: c.text, fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  list: { padding: 16, paddingBottom: 80 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: c.background },
  loadingText: { fontSize: 16, color: c.textSecondary, marginTop: 12 },
  errorText: { fontSize: 16, color: c.primary, marginBottom: 16, textAlign: 'center' },
  retryBtn: { backgroundColor: c.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 18, color: c.textSecondary, fontWeight: '600' },
  emptySubtext: { fontSize: 14, color: c.textTertiary, marginTop: 8 },
  footer: { paddingVertical: 16, alignItems: 'center' },
  fab: {
    position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28,
    backgroundColor: c.primary, justifyContent: 'center', alignItems: 'center',
    elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4,
  },
  fabText: { fontSize: 28, color: '#fff', lineHeight: 30 },
});
