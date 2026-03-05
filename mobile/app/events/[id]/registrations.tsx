import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { eventsApi, Registration } from '../../../src/api/events';
import { RegistrationStatusBadge } from '../../../src/components/RegistrationStatusBadge';
import { CountryFlag } from '../../../src/components/CountryFlag';
import { useTheme, Theme } from '../../../src/theme/useTheme';

const STATUS_FILTERS = ['all', 'pending', 'approved', 'rejected', 'waitlisted'];

export default function EventRegistrationsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadRegistrations = useCallback(async () => {
    if (!id) return;
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : undefined;
      const data = await eventsApi.getEventRegistrations(id, params);
      setRegistrations(data.items);
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [id, statusFilter]);

  useEffect(() => {
    setIsLoading(true);
    loadRegistrations();
  }, [loadRegistrations]);

  const handleUpdateStatus = async (regId: string, status: string) => {
    if (!id) return;
    setUpdatingId(regId);
    try {
      const updated = await eventsApi.updateRegistrationStatus(id, regId, { status });
      setRegistrations((prev) =>
        prev.map((r) => (r.id === regId ? { ...r, status: updated.status } : r)),
      );
    } catch (err: any) {
      Alert.alert(t('error'), err.message || t('error'));
    } finally {
      setUpdatingId(null);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRegistrations();
  };

  const renderItem = ({ item }: { item: Registration }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.user?.nickname?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <View>
            <View style={styles.nameRow}>
              <Text style={styles.nickname}>{item.user?.nickname || 'Unknown'}</Text>
              {item.user?.countryCode && <CountryFlag countryCode={item.user.countryCode} size={14} />}
            </View>
            <Text style={styles.date}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <RegistrationStatusBadge status={item.status} />
      </View>

      {item.message && (
        <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
      )}

      {(item.status === 'pending' || item.status === 'waitlisted') && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.approveBtn}
            onPress={() => handleUpdateStatus(item.id, 'approved')}
            disabled={updatingId === item.id}
          >
            {updatingId === item.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.approveBtnText}>{t('approve')}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.rejectBtn}
            onPress={() => handleUpdateStatus(item.id, 'rejected')}
            disabled={updatingId === item.id}
          >
            <Text style={styles.rejectBtnText}>{t('reject')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (isLoading && registrations.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((sf) => (
          <TouchableOpacity
            key={sf}
            style={[styles.filterChip, statusFilter === sf && styles.filterChipActive]}
            onPress={() => setStatusFilter(sf)}
          >
            <Text style={[styles.filterText, statusFilter === sf && styles.filterTextActive]}>
              {sf === 'all' ? t('all') : sf.charAt(0).toUpperCase() + sf.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={registrations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('noRegistrations')}</Text>
          </View>
        }
      />
    </View>
  );
}

const createStyles = (c: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: c.surface,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: c.border,
  },
  filterChipActive: { backgroundColor: c.primary },
  filterText: { fontSize: 12, color: c.textSecondary, fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  list: { padding: 16 },
  card: {
    backgroundColor: c.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: c.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  nickname: { fontSize: 14, fontWeight: '600', color: c.text },
  date: { fontSize: 11, color: c.textTertiary, marginTop: 1 },
  message: { fontSize: 13, color: c.textSecondary, marginTop: 8, fontStyle: 'italic' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  approveBtn: {
    flex: 1,
    backgroundColor: c.success,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  approveBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  rejectBtn: {
    flex: 1,
    backgroundColor: c.surface,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.error,
  },
  rejectBtnText: { color: c.error, fontWeight: '600', fontSize: 13 },
  empty: { paddingTop: 60, alignItems: 'center' },
  emptyText: { fontSize: 16, color: c.textTertiary },
});
