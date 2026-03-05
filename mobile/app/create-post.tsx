import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCommunityStore } from '../src/store/useCommunityStore';
import { useAuthStore } from '../src/store/useAuthStore';
import { useTheme, Theme } from '../src/theme/useTheme';

type PostType = 'general' | 'question' | 'event_share' | 'video';
type CountryScope = 'global' | 'my_country';
const POST_TYPES: { value: PostType; labelKey: string }[] = [
  { value: 'general', labelKey: 'postTypeGeneral' }, { value: 'question', labelKey: 'postTypeQuestion' },
  { value: 'event_share', labelKey: 'postTypeEventShare' }, { value: 'video', labelKey: 'postTypeVideo' },
];
const SCOPE_OPTIONS: { value: CountryScope; labelKey: string }[] = [
  { value: 'global', labelKey: 'scopeGlobal' }, { value: 'my_country', labelKey: 'scopeMyCountry' },
];

export default function CreatePostScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { createPost } = useCommunityStore();
  const { colors } = useTheme();
  const styles = useMemo(() => cs(colors), [colors]);
  const [contentText, setContentText] = useState('');
  const [selectedPostType, setSelectedPostType] = useState<PostType>('general');
  const [selectedScope, setSelectedScope] = useState<CountryScope>('global');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = contentText.trim();
    if (!trimmed) { Alert.alert('', t('postPlaceholder')); return; }
    setIsSubmitting(true);
    try {
      await createPost({ contentText: trimmed, postType: selectedPostType, countryScope: selectedScope === 'my_country' && user?.countryCode ? user.countryCode : undefined });
      router.back();
    } catch (err: any) { Alert.alert(t('error'), err.message || t('error')); }
    finally { setIsSubmitting(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.wrapper} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <TextInput style={styles.textInput} placeholder={t('postPlaceholder')} placeholderTextColor={colors.textTertiary} multiline maxLength={2000} value={contentText} onChangeText={setContentText} autoFocus />
          <Text style={styles.charCount}>{contentText.length}/2000</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('postType')}</Text>
          <View style={styles.chipRow}>
            {POST_TYPES.map((o) => (
              <TouchableOpacity key={o.value} style={[styles.chip, selectedPostType === o.value && styles.chipActive]} onPress={() => setSelectedPostType(o.value)}>
                <Text style={[styles.chipText, selectedPostType === o.value && styles.chipTextActive]}>{t(o.labelKey)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('countryScope')}</Text>
          <View style={styles.chipRow}>
            {SCOPE_OPTIONS.map((o) => (
              <TouchableOpacity key={o.value} style={[styles.chip, selectedScope === o.value && styles.chipActive]} onPress={() => setSelectedScope(o.value)}>
                <Text style={[styles.chipText, selectedScope === o.value && styles.chipTextActive]}>{t(o.labelKey)}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {selectedScope === 'my_country' && user?.countryCode && <Text style={styles.scopeHint}>{user.countryCode}</Text>}
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()} disabled={isSubmitting}><Text style={styles.cancelBtnText}>{t('cancel')}</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.submitBtn, (!contentText.trim() || isSubmitting) && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={!contentText.trim() || isSubmitting}>
          {isSubmitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitBtnText}>{t('submit')}</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const cs = (c: Theme) => StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: c.background },
  container: { flex: 1 },
  section: { backgroundColor: c.surface, marginBottom: 12, padding: 16 },
  textInput: { fontSize: 16, color: c.text, minHeight: 160, textAlignVertical: 'top', lineHeight: 24 },
  charCount: { fontSize: 12, color: c.textTertiary, textAlign: 'right', marginTop: 8 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: c.primary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: c.border, backgroundColor: c.surfaceSecondary },
  chipActive: { backgroundColor: c.primary, borderColor: c.primary },
  chipText: { fontSize: 14, color: c.textSecondary },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  scopeHint: { fontSize: 12, color: c.textTertiary, marginTop: 8, fontStyle: 'italic' },
  bottomBar: { flexDirection: 'row', backgroundColor: c.surface, padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: c.border, paddingBottom: Platform.OS === 'ios' ? 32 : 16 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, borderWidth: 1.5, borderColor: c.border, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, color: c.textSecondary, fontWeight: '500' },
  submitBtn: { flex: 2, paddingVertical: 14, borderRadius: 10, backgroundColor: c.primary, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { fontSize: 15, color: '#fff', fontWeight: '700' },
});
