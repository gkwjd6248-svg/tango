import { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CountryFlag } from './CountryFlag';
import { eventsApi, ChatMessage } from '../api/events';
import { useTheme, Theme } from '../theme/useTheme';

interface Props {
  message: ChatMessage;
  eventId: string;
  isOwn: boolean;
}

function getTimeStr(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function ChatBubble({ message, eventId, isOwn }: Props) {
  const { i18n } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [showTranslated, setShowTranslated] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const handleTranslate = async () => {
    if (translatedText) {
      setShowTranslated((prev) => !prev);
      return;
    }
    setIsTranslating(true);
    try {
      const result = await eventsApi.translateChatMessage(eventId, message.id, i18n.language || 'en');
      setTranslatedText(result.translatedText);
      setShowTranslated(true);
    } catch {
      // Silent fail
    } finally {
      setIsTranslating(false);
    }
  };

  const displayText = showTranslated && translatedText ? translatedText : message.message;

  return (
    <View style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer]}>
      {!isOwn && (
        <View style={styles.senderRow}>
          <Text style={styles.senderName}>{message.user.nickname}</Text>
          {message.user.countryCode && (
            <CountryFlag countryCode={message.user.countryCode} size={12} />
          )}
        </View>
      )}
      <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
        <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>{displayText}</Text>
        {showTranslated && translatedText && (
          <Text style={styles.translatedLabel}>Translated</Text>
        )}
      </View>
      <View style={[styles.metaRow, isOwn && styles.ownMetaRow]}>
        <Text style={styles.time}>{getTimeStr(new Date(message.createdAt))}</Text>
        {!isOwn && (
          <TouchableOpacity onPress={handleTranslate} disabled={isTranslating}>
            {isTranslating ? (
              <ActivityIndicator size="small" color={colors.textTertiary} />
            ) : (
              <Text style={styles.translateBtn}>
                {showTranslated ? '원문' : 'Translate'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const createStyles = (c: Theme) => StyleSheet.create({
  container: { marginVertical: 4, paddingHorizontal: 12, maxWidth: '80%' },
  ownContainer: { alignSelf: 'flex-end' },
  otherContainer: { alignSelf: 'flex-start' },
  senderRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2, marginLeft: 4 },
  senderName: { fontSize: 11, color: c.textTertiary, fontWeight: '600' },
  bubble: { borderRadius: 16, padding: 10, paddingHorizontal: 14 },
  ownBubble: { backgroundColor: c.primary, borderBottomRightRadius: 4 },
  otherBubble: { backgroundColor: c.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: c.border },
  messageText: { fontSize: 15, color: c.text, lineHeight: 20 },
  ownMessageText: { color: '#fff' },
  translatedLabel: { fontSize: 10, color: '#DAA520', fontStyle: 'italic', marginTop: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2, marginLeft: 4 },
  ownMetaRow: { justifyContent: 'flex-end', marginRight: 4, marginLeft: 0 },
  time: { fontSize: 10, color: c.textTertiary },
  translateBtn: { fontSize: 11, color: '#2196F3' },
});
