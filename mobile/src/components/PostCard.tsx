import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CountryFlag } from './CountryFlag';

interface Props {
  post: {
    id: string;
    contentText: string;
    likeCount: number;
    commentCount: number;
    createdAt: string;
    user: {
      nickname: string;
      countryCode: string;
    };
  };
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

export function PostCard({ post }: Props) {
  const timeAgo = getTimeAgo(new Date(post.createdAt));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{post.user.nickname.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.nickname}>{post.user.nickname}</Text>
            <CountryFlag countryCode={post.user.countryCode} size={14} />
          </View>
          <Text style={styles.time}>{timeAgo}</Text>
        </View>
      </View>
      <Text style={styles.content}>{post.contentText}</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionText}>Like {post.likeCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionText}>Comment {post.commentCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionText}>Translate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E91E63', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  headerInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nickname: { fontSize: 15, fontWeight: '600', color: '#333' },
  time: { fontSize: 12, color: '#999', marginTop: 2 },
  content: { fontSize: 15, color: '#333', lineHeight: 22, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center' },
  actionText: { fontSize: 13, color: '#666' },
});
