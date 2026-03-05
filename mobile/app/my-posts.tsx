import { View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { communityApi, Post } from '../src/api/community';
import { PostCard } from '../src/components/PostCard';
import { useTheme, Theme } from '../src/theme/useTheme';

export default function MyPostsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadPosts = async (reset = false) => {
    const currentPage = reset ? 1 : page;
    if (!reset) setIsLoading(true);
    setError(null);
    try {
      const response = await communityApi.getPosts({ page: currentPage, limit: 20 });
      if (reset) setPosts(response.items); else setPosts((prev) => [...prev, ...response.items]);
      setHasMore(currentPage < response.totalPages);
      setPage(currentPage + 1);
    } catch (err: any) { setError(err.message || t('error')); }
    finally { setIsLoading(false); }
  };

  const onRefresh = async () => { setRefreshing(true); setPage(1); await loadPosts(true); setRefreshing(false); };
  useEffect(() => { loadPosts(true); }, []);

  if (isLoading && posts.length === 0) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.loadingText}>{t('loading')}</Text></View>;
  }

  if (error && posts.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => loadPosts(true)}><Text style={styles.retryBtnText}>{t('retry')}</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts} keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
        onEndReached={() => loadPosts()} onEndReachedThreshold={0.3}
        ListFooterComponent={hasMore ? <View style={styles.footer}><ActivityIndicator size="small" color={colors.primary} /></View> : null}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>{t('noPosts')}</Text><Text style={styles.emptySubtext}>{t('beFirst')}</Text></View>}
      />
    </View>
  );
}

const createStyles = (c: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  list: { padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: c.background },
  loadingText: { fontSize: 16, color: c.textSecondary, marginTop: 12 },
  errorText: { fontSize: 16, color: c.primary, marginBottom: 16, textAlign: 'center' },
  retryBtn: { backgroundColor: c.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 18, color: c.textSecondary, fontWeight: '600' },
  emptySubtext: { fontSize: 14, color: c.textTertiary, marginTop: 8 },
  footer: { paddingVertical: 16, alignItems: 'center' },
});
