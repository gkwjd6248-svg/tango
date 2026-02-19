import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CountryFlag } from './CountryFlag';
import { communityApi } from '../api/community';
import { useCommunityStore } from '../store/useCommunityStore';

interface Props {
  post: {
    id: string;
    contentText: string;
    likeCount: number;
    commentCount: number;
    createdAt: string;
    translatedText?: string;
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
  const { t, i18n } = useTranslation();
  const { updatePostLike, updatePostTranslation } = useCommunityStore();

  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [liked, setLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslated, setShowTranslated] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(
    post.translatedText ?? null,
  );

  const timeAgo = getTimeAgo(new Date(post.createdAt));

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      const result = await communityApi.toggleLike('post', post.id);
      setLiked(result.liked);
      setLikeCount(result.likeCount);
      updatePostLike(post.id, result.liked, result.likeCount);
    } catch {
      // Silent fail — optimistic UI not applied
    } finally {
      setIsLiking(false);
    }
  };

  const handleTranslate = async () => {
    // If we already have a translation, toggle display
    if (translatedText) {
      setShowTranslated((prev) => !prev);
      return;
    }

    setIsTranslating(true);
    try {
      const targetLanguage = i18n.language || 'en';
      const result = await communityApi.translatePost(post.id, targetLanguage);
      setTranslatedText(result.translatedText);
      setShowTranslated(true);
      updatePostTranslation(post.id, result.translatedText);
    } catch {
      // Silent fail
    } finally {
      setIsTranslating(false);
    }
  };

  const displayText =
    showTranslated && translatedText ? translatedText : post.contentText;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {post.user.nickname.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.nickname}>{post.user.nickname}</Text>
            <CountryFlag countryCode={post.user.countryCode} size={14} />
          </View>
          <Text style={styles.time}>{timeAgo}</Text>
        </View>
      </View>

      <Text style={styles.content}>{displayText}</Text>

      {showTranslated && translatedText && (
        <Text style={styles.translatedLabel}>{t('translatedText')}</Text>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleLike}
          disabled={isLiking}
          accessibilityLabel={t('like')}
        >
          {isLiking ? (
            <ActivityIndicator size="small" color="#E91E63" />
          ) : (
            <Text style={[styles.actionText, liked && styles.actionTextActive]}>
              {liked ? 'Liked' : t('like')} {likeCount}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} accessibilityLabel={t('comment')}>
          <Text style={styles.actionText}>
            {t('comment')} {post.commentCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleTranslate}
          disabled={isTranslating}
          accessibilityLabel={t('translate')}
        >
          {isTranslating ? (
            <ActivityIndicator size="small" color="#666" />
          ) : (
            <Text style={styles.actionText}>
              {showTranslated && translatedText ? t('showOriginal') : t('translate')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B0000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  headerInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nickname: { fontSize: 15, fontWeight: '600', color: '#333' },
  time: { fontSize: 12, color: '#999', marginTop: 2 },
  content: { fontSize: 15, color: '#333', lineHeight: 22, marginBottom: 4 },
  translatedLabel: {
    fontSize: 11,
    color: '#DAA520',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginTop: 8,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', minWidth: 60 },
  actionText: { fontSize: 13, color: '#666' },
  actionTextActive: { color: '#8B0000', fontWeight: '600' },
});
