import { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { eventsApi, VoteResult } from '../api/events';
import { useAuthStore } from '../store/useAuthStore';
import { useTheme, Theme } from '../theme/useTheme';

interface Props {
  eventId: string;
  initialVotes: VoteResult;
}

export function VoteBar({ eventId, initialVotes }: Props) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [votes, setVotes] = useState<VoteResult>(initialVotes);
  const [isVoting, setIsVoting] = useState(false);

  const total = votes.likes + votes.dislikes;
  const likePercent = total > 0 ? Math.round((votes.likes / total) * 100) : 50;

  const handleVote = async (voteType: 'like' | 'dislike') => {
    if (!isAuthenticated || isVoting) return;
    setIsVoting(true);
    try {
      const result = await eventsApi.voteEvent(eventId, voteType);
      setVotes(result);
    } catch {
      // Silent fail
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.voteBtn, votes.userVote === 'like' && styles.voteBtnActive]}
          onPress={() => handleVote('like')}
          disabled={isVoting || !isAuthenticated}
        >
          {isVoting ? (
            <ActivityIndicator size="small" color={colors.success} />
          ) : (
            <>
              <Text style={[styles.voteIcon, votes.userVote === 'like' && styles.voteIconActive]}>
                {votes.userVote === 'like' ? '▲' : '△'}
              </Text>
              <Text style={[styles.voteCount, votes.userVote === 'like' && styles.voteCountActive]}>
                {votes.likes}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.voteBtn, votes.userVote === 'dislike' && styles.voteBtnActiveDown]}
          onPress={() => handleVote('dislike')}
          disabled={isVoting || !isAuthenticated}
        >
          <Text style={[styles.voteIcon, votes.userVote === 'dislike' && styles.voteIconActiveDown]}>
            {votes.userVote === 'dislike' ? '▼' : '▽'}
          </Text>
          <Text style={[styles.voteCount, votes.userVote === 'dislike' && styles.voteCountActiveDown]}>
            {votes.dislikes}
          </Text>
        </TouchableOpacity>
      </View>

      {total > 0 && (
        <View style={styles.barContainer}>
          <View style={[styles.barFill, { width: `${likePercent}%` }]} />
          <Text style={styles.percentText}>{likePercent}% {t('like')}</Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (c: Theme) => StyleSheet.create({
  container: { marginTop: 8 },
  buttonRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  voteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  voteBtnActive: { borderColor: c.success, backgroundColor: '#E8F5E9' },
  voteBtnActiveDown: { borderColor: c.error, backgroundColor: '#FFEBEE' },
  voteIcon: { fontSize: 16, color: c.textSecondary },
  voteIconActive: { color: c.success },
  voteIconActiveDown: { color: c.error },
  voteCount: { fontSize: 14, color: c.textSecondary, fontWeight: '600' },
  voteCountActive: { color: c.success },
  voteCountActiveDown: { color: c.error },
  barContainer: {
    height: 24,
    backgroundColor: '#FFCDD2',
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  barFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#C8E6C9',
    borderRadius: 12,
  },
  percentText: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: c.text,
  },
});
