import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { eventsApi, ChatMessage } from '../../../src/api/events';
import { ChatBubble } from '../../../src/components/ChatBubble';
import { useAuthStore } from '../../../src/store/useAuthStore';
import { useTheme, Theme } from '../../../src/theme/useTheme';

export default function EventChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  const loadMessages = useCallback(async (pageNum: number) => {
    if (!id) return;
    try {
      const data = await eventsApi.getChatMessages(id, pageNum, 30);
      if (pageNum === 1) {
        setMessages(data.items);
      } else {
        setMessages((prev) => [...prev, ...data.items]);
      }
      setHasMore(pageNum < data.totalPages);
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadMessages(1);
    // Poll for new messages every 5 seconds
    const interval = setInterval(() => {
      loadMessages(1);
    }, 5000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  const loadMore = () => {
    if (!hasMore || isLoading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadMessages(nextPage);
  };

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isSending || !id) return;
    setIsSending(true);
    setInputText('');
    try {
      const newMsg = await eventsApi.sendChatMessage(id, trimmed);
      setMessages((prev) => [newMsg, ...prev]);
    } catch {
      setInputText(trimmed);
    } finally {
      setIsSending(false);
    }
  };

  const renderDateSeparator = (current: ChatMessage, previous?: ChatMessage) => {
    const currentDate = new Date(current.createdAt).toLocaleDateString();
    const prevDate = previous ? new Date(previous.createdAt).toLocaleDateString() : null;
    if (currentDate !== prevDate) {
      return (
        <View style={styles.dateSeparator}>
          <View style={styles.dateLine} />
          <Text style={styles.dateText}>{currentDate}</Text>
          <View style={styles.dateLine} />
        </View>
      );
    }
    return null;
  };

  if (isLoading && messages.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        inverted
        renderItem={({ item, index }) => (
          <View>
            {renderDateSeparator(item, messages[index + 1])}
            <ChatBubble
              message={item}
              eventId={id as string}
              isOwn={item.userId === user?.id}
            />
          </View>
        )}
        contentContainerStyle={styles.messageList}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('noChatMessages')}</Text>
            <Text style={styles.emptySubtext}>{t('startConversation')}</Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder={t('typeMessage')}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!inputText.trim() || isSending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendBtnText}>{'>'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (c: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 14, color: c.textSecondary, marginTop: 8 },
  messageList: { paddingVertical: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 16, color: c.textSecondary, fontWeight: '600' },
  emptySubtext: { fontSize: 13, color: c.textTertiary, marginTop: 4 },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateLine: { flex: 1, height: 1, backgroundColor: c.border },
  dateText: { fontSize: 11, color: c.textTertiary, marginHorizontal: 12 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    paddingBottom: 12,
    backgroundColor: c.surface,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  input: {
    flex: 1,
    backgroundColor: c.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: c.text,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: c.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
