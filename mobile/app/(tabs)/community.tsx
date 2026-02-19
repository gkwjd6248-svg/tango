import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { PostCard } from '../../src/components/PostCard';

export default function CommunityScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [filter, setFilter] = useState<'global' | 'country'>('global');

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {(['global', 'country'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'global' ? 'Global' : 'My Country'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>Be the first to share!</Text>
          </View>
        }
      />
      <TouchableOpacity style={styles.fab}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  filterRow: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#fff' },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#f0f0f0', borderRadius: 20 },
  filterActive: { backgroundColor: '#E91E63' },
  filterText: { fontSize: 14, color: '#333' },
  filterTextActive: { color: '#fff' },
  list: { padding: 16 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 18, color: '#666', fontWeight: '600' },
  emptySubtext: { fontSize: 14, color: '#999', marginTop: 8 },
  fab: {
    position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#E91E63', justifyContent: 'center', alignItems: 'center',
    elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4,
  },
  fabText: { fontSize: 28, color: '#fff', lineHeight: 30 },
});
