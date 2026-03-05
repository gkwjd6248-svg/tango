import { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Notification } from '../api/notifications';
import { useTheme, Theme } from '../theme/useTheme';

interface Props {
  notification: Notification;
  onPress: (notification: Notification) => void;
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const typeIcons: Record<string, string> = {
  new_event: '📅',
  new_like: '❤️',
  new_comment: '💬',
  registration_approved: '✅',
  registration_rejected: '❌',
  event_reminder: '⏰',
};

export function NotificationItem({ notification, onPress }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const icon = typeIcons[notification.type] || '🔔';
  const timeAgo = getTimeAgo(new Date(notification.createdAt));

  return (
    <TouchableOpacity
      style={[styles.container, !notification.isRead && styles.unread]}
      onPress={() => onPress(notification)}
      accessibilityRole="button"
    >
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.content}>
        <Text style={[styles.title, !notification.isRead && styles.titleUnread]} numberOfLines={1}>
          {notification.title}
        </Text>
        <Text style={styles.body} numberOfLines={2}>
          {notification.body}
        </Text>
        <Text style={styles.time}>{timeAgo}</Text>
      </View>
      {!notification.isRead && <View style={styles.dot} />}
    </TouchableOpacity>
  );
}

const createStyles = (c: Theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: c.surface,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  unread: { backgroundColor: '#FFF8F0' },
  icon: { fontSize: 24, marginRight: 12, marginTop: 2 },
  content: { flex: 1 },
  title: { fontSize: 14, fontWeight: '500', color: c.text, marginBottom: 2 },
  titleUnread: { fontWeight: '700' },
  body: { fontSize: 13, color: c.textSecondary, lineHeight: 18, marginBottom: 4 },
  time: { fontSize: 11, color: c.textTertiary },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: c.primaryLight,
    marginTop: 6,
    marginLeft: 8,
  },
});
