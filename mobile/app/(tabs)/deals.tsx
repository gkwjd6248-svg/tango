import { View, Text, FlatList, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useState } from 'react';

interface Deal {
  id: string;
  title: string;
  originalPrice: number;
  dealPrice: number;
  currency: string;
  discountPercentage: number;
  affiliateUrl: string;
  provider: string;
}

const categories = [
  { key: 'all', label: 'All' },
  { key: 'shoes', label: 'Shoes' },
  { key: 'clothing', label: 'Clothing' },
  { key: 'accessories', label: 'Accessories' },
];

export default function DealsScreen() {
  const [deals] = useState<Deal[]>([]);
  const [category, setCategory] = useState('all');

  return (
    <View style={styles.container}>
      <View style={styles.categoryRow}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.categoryBtn, category === cat.key && styles.categoryBtnActive]}
            onPress={() => setCategory(cat.key)}
          >
            <Text style={[styles.categoryText, category === cat.key && styles.categoryTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={deals}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => Linking.openURL(item.affiliateUrl)}>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.dealPrice}>${item.dealPrice}</Text>
              <Text style={styles.originalPrice}>${item.originalPrice}</Text>
            </View>
            <Text style={styles.provider}>{item.provider}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Deals coming soon!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  categoryRow: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#fff' },
  categoryBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0' },
  categoryBtnActive: { backgroundColor: '#E91E63' },
  categoryText: { fontSize: 14, color: '#333' },
  categoryTextActive: { color: '#fff' },
  list: { padding: 8 },
  card: { flex: 1, margin: 8, backgroundColor: '#fff', borderRadius: 12, padding: 12, elevation: 2 },
  cardTitle: { fontSize: 14, color: '#333', marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dealPrice: { fontSize: 16, fontWeight: 'bold', color: '#E91E63' },
  originalPrice: { fontSize: 12, color: '#999', textDecorationLine: 'line-through' },
  provider: { fontSize: 11, color: '#999', marginTop: 4 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 18, color: '#666', fontWeight: '600' },
});
