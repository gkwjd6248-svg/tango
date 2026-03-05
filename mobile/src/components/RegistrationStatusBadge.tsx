import { View, Text, StyleSheet } from 'react-native';

interface Props {
  status: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  approved: { bg: '#E8F5E9', text: '#2E7D32' },
  pending: { bg: '#FFF3E0', text: '#E65100' },
  rejected: { bg: '#FFEBEE', text: '#C62828' },
  cancelled: { bg: '#ECEFF1', text: '#546E7A' },
  waitlisted: { bg: '#E3F2FD', text: '#1565C0' },
};

const statusLabels: Record<string, string> = {
  approved: 'Approved',
  pending: 'Pending',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  waitlisted: 'Waitlisted',
};

export function RegistrationStatusBadge({ status }: Props) {
  const colors = statusColors[status] || statusColors.pending;
  const label = statusLabels[status] || status;

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
