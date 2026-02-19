import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCommunityStore } from '../src/store/useCommunityStore';
import { useAuthStore } from '../src/store/useAuthStore';

type PostType = 'general' | 'question' | 'event_share' | 'video';
type CountryScope = 'global' | 'my_country';

interface PostTypeOption {
  value: PostType;
  labelKey: string;
}

interface ScopeOption {
  value: CountryScope;
  labelKey: string;
}

const POST_TYPES: PostTypeOption[] = [
  { value: 'general', labelKey: 'postTypeGeneral' },
  { value: 'question', labelKey: 'postTypeQuestion' },
  { value: 'event_share', labelKey: 'postTypeEventShare' },
  { value: 'video', labelKey: 'postTypeVideo' },
];

const SCOPE_OPTIONS: ScopeOption[] = [
  { value: 'global', labelKey: 'scopeGlobal' },
  { value: 'my_country', labelKey: 'scopeMyCountry' },
];

export default function CreatePostScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { createPost } = useCommunityStore();

  const [contentText, setContentText] = useState('');
  const [selectedPostType, setSelectedPostType] = useState<PostType>('general');
  const [selectedScope, setSelectedScope] = useState<CountryScope>('global');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = contentText.trim();
    if (!trimmed) {
      Alert.alert('', t('postPlaceholder'));
      return;
    }

    setIsSubmitting(true);
    try {
      const countryScope =
        selectedScope === 'my_country' && user?.countryCode
          ? user.countryCode
          : undefined;

      await createPost({
        contentText: trimmed,
        postType: selectedPostType,
        countryScope,
      });

      // Navigate back on success
      router.back();
    } catch (err: any) {
      Alert.alert(t('error'), err.message || t('error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {/* Content input */}
        <View style={styles.section}>
          <TextInput
            style={styles.textInput}
            placeholder={t('postPlaceholder')}
            placeholderTextColor="#bbb"
            multiline
            maxLength={2000}
            value={contentText}
            onChangeText={setContentText}
            accessibilityLabel={t('writePost')}
            autoFocus
          />
          <Text style={styles.charCount}>{contentText.length}/2000</Text>
        </View>

        {/* Post type selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('postType')}</Text>
          <View style={styles.chipRow}>
            {POST_TYPES.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.chip,
                  selectedPostType === option.value && styles.chipActive,
                ]}
                onPress={() => setSelectedPostType(option.value)}
                accessibilityRole="radio"
                accessibilityState={{ checked: selectedPostType === option.value }}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedPostType === option.value && styles.chipTextActive,
                  ]}
                >
                  {t(option.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Country scope selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('countryScope')}</Text>
          <View style={styles.chipRow}>
            {SCOPE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.chip,
                  selectedScope === option.value && styles.chipActive,
                ]}
                onPress={() => setSelectedScope(option.value)}
                accessibilityRole="radio"
                accessibilityState={{ checked: selectedScope === option.value }}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedScope === option.value && styles.chipTextActive,
                  ]}
                >
                  {t(option.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {selectedScope === 'my_country' && user?.countryCode && (
            <Text style={styles.scopeHint}>
              {user.countryCode}
            </Text>
          )}
        </View>

        {/* Spacer for keyboard */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom submit bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => router.back()}
          disabled={isSubmitting}
        >
          <Text style={styles.cancelBtnText}>{t('cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.submitBtn,
            (!contentText.trim() || isSubmitting) && styles.submitBtnDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!contentText.trim() || isSubmitting}
          accessibilityRole="button"
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>{t('submit')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#f5f5f5' },
  container: { flex: 1 },

  section: {
    backgroundColor: '#fff',
    marginBottom: 12,
    padding: 16,
  },

  textInput: {
    fontSize: 16,
    color: '#1A1A1A',
    minHeight: 160,
    textAlignVertical: 'top',
    lineHeight: 24,
  },
  charCount: {
    fontSize: 12,
    color: '#bbb',
    textAlign: 'right',
    marginTop: 8,
  },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8B0000',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#ddd',
    backgroundColor: '#fafafa',
  },
  chipActive: {
    backgroundColor: '#8B0000',
    borderColor: '#8B0000',
  },
  chipText: { fontSize: 14, color: '#555' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  scopeHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },

  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, color: '#666', fontWeight: '500' },
  submitBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#8B0000',
    alignItems: 'center',
  },
  submitBtnDisabled: { backgroundColor: '#ccc' },
  submitBtnText: { fontSize: 15, color: '#fff', fontWeight: '700' },
});
