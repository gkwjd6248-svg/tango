import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CountryFlag } from './CountryFlag';
import { communityApi, Comment } from '../api/community';
import { useCommunityStore } from '../store/useCommunityStore';
import { useTheme, Theme } from '../theme/useTheme';

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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [liked, setLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslated, setShowTranslated] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(
    post.translatedText ?? null,
  );

  // Comments modal state
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSendingComment, setIsSendingComment] = useState(false);

  const timeAgo = getTimeAgo(new Date(post.createdAt));

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      const result = await communityApi.toggleLike('post', post.id);
      setLiked(result.liked);
      setLikeCount(result.likeCount);
      updatePostLike(post.id, result.liked, result.likeCount);
    } catch {} finally {
      setIsLiking(false);
    }
  };

  const handleTranslate = async () => {
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
    } catch {} finally {
      setIsTranslating(false);
    }
  };

  const handleOpenComments = async () => {
    setShowComments(true);
    setIsLoadingComments(true);
    try {
      const data = await communityApi.getComments(post.id, 1, 50);
      setComments(data.items);
    } catch {} finally {
      setIsLoadingComments(false);
    }
  };

  const handleSendComment = async () => {
    const trimmed = commentText.trim();
    if (!trimmed || isSendingComment) return;
    setIsSendingComment(true);
    try {
      const newComment = await communityApi.createComment(post.id, trimmed);
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
      setCommentCount((c) => c + 1);
    } catch {} finally {
      setIsSendingComment(false);
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
            <ActivityIndicator size="small" color={colors.primaryLight} />
          ) : (
            <Text style={[styles.actionText, liked && styles.actionTextActive]}>
              {liked ? '♥' : '♡'} {likeCount}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleOpenComments}
          accessibilityLabel={t('comment')}
        >
          <Text style={styles.actionText}>
            {t('comment')} {commentCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleTranslate}
          disabled={isTranslating}
          accessibilityLabel={t('translate')}
        >
          {isTranslating ? (
            <ActivityIndicator size="small" color={colors.textSecondary} />
          ) : (
            <Text style={styles.actionText}>
              {showTranslated && translatedText ? t('showOriginal') : t('translate')}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Comments Modal */}
      <Modal visible={showComments} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.commentsModal}>
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsTitle}>{t('comment')} ({commentCount})</Text>
              <TouchableOpacity onPress={() => setShowComments(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {isLoadingComments ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 32 }} />
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.commentsList}
                renderItem={({ item }) => (
                  <View style={styles.commentItem}>
                    <View style={styles.commentAvatar}>
                      <Text style={styles.commentAvatarText}>
                        {item.user.nickname.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.commentContent}>
                      <View style={styles.commentNameRow}>
                        <Text style={styles.commentName}>{item.user.nickname}</Text>
                        <CountryFlag countryCode={item.user.countryCode} size={12} />
                        <Text style={styles.commentTime}>
                          {getTimeAgo(new Date(item.createdAt))}
                        </Text>
                      </View>
                      <Text style={styles.commentText}>{item.contentText}</Text>
                    </View>
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={styles.noComments}>{t('noPosts')}</Text>
                }
              />
            )}

            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                value={commentText}
                onChangeText={setCommentText}
                placeholder={t('writePost')}
                placeholderTextColor={colors.textTertiary}
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.sendCommentBtn, (!commentText.trim() || isSendingComment) && styles.sendCommentBtnDisabled]}
                onPress={handleSendComment}
                disabled={!commentText.trim() || isSendingComment}
              >
                {isSendingComment ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.sendCommentText}>{'>'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const createStyles = (c: Theme) => StyleSheet.create({
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
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: c.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  headerInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nickname: { fontSize: 15, fontWeight: '600', color: c.text },
  time: { fontSize: 12, color: c.textTertiary, marginTop: 2 },
  content: { fontSize: 15, color: c.text, lineHeight: 22, marginBottom: 4 },
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
    borderTopColor: c.border,
    paddingTop: 12,
    marginTop: 8,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', minWidth: 60 },
  actionText: { fontSize: 13, color: c.textSecondary },
  actionTextActive: { color: c.primary, fontWeight: '600' },

  // Comments Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  commentsModal: {
    backgroundColor: c.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  commentsTitle: { fontSize: 16, fontWeight: '700', color: c.text },
  closeBtn: { fontSize: 20, color: c.textTertiary, padding: 4 },
  commentsList: { padding: 16 },
  commentItem: { flexDirection: 'row', marginBottom: 16 },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: c.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  commentAvatarText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  commentContent: { flex: 1 },
  commentNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  commentName: { fontSize: 13, fontWeight: '600', color: c.text },
  commentTime: { fontSize: 11, color: c.textTertiary, marginLeft: 4 },
  commentText: { fontSize: 14, color: c.textSecondary, lineHeight: 20 },
  noComments: { textAlign: 'center', color: c.textTertiary, marginTop: 24 },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  commentInput: {
    flex: 1,
    backgroundColor: c.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: c.text,
  },
  sendCommentBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: c.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendCommentBtnDisabled: { opacity: 0.4 },
  sendCommentText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
