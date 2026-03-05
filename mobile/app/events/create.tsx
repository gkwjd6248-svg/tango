import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { eventsApi } from '../../src/api/events';
import { useTheme, Theme } from '../../src/theme/useTheme';

const EVENT_TYPES = ['milonga', 'festival', 'workshop', 'class', 'practica'];
const COUNTRIES = [
  'AR', 'BR', 'CL', 'CO', 'DE', 'ES', 'FR', 'GB', 'IT', 'JP',
  'KR', 'MX', 'NL', 'PE', 'TR', 'US', 'UY', 'VN',
];

export default function CreateEventScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('milonga');
  const [description, setDescription] = useState('');
  const [venueName, setVenueName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [startDatetime, setStartDatetime] = useState('');
  const [endDatetime, setEndDatetime] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [organizerContact, setOrganizerContact] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 5 - images.length,
      quality: 0.8,
    });
    if (!result.canceled) {
      setImages((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, 5));
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !venueName.trim() || !city.trim() || !startDatetime.trim() || !organizerContact.trim()) {
      Alert.alert(t('error'), t('fillRequired'));
      return;
    }
    setIsSubmitting(true);
    try {
      let imageUrls: string[] = [];
      if (images.length > 0) {
        const formData = new FormData();
        images.forEach((uri, i) => {
          formData.append('images', {
            uri,
            name: `image_${i}.jpg`,
            type: 'image/jpeg',
          } as any);
        });
        const uploadResult = await eventsApi.uploadImages(formData);
        imageUrls = uploadResult.imageUrls;
      }

      await eventsApi.createEvent({
        title: title.trim(),
        eventType,
        description: description.trim(),
        venueName: venueName.trim(),
        venueAddress: address.trim(),
        city: city.trim(),
        countryCode,
        startDatetime,
        endDatetime: endDatetime || undefined,
        price: price ? parseFloat(price) : undefined,
        currency: currency || undefined,
        maxParticipants: maxParticipants ? parseInt(maxParticipants, 10) : undefined,
        registrationDeadline: registrationDeadline || undefined,
        organizerName: organizerName.trim() || undefined,
        organizerContact: organizerContact.trim(),
        websiteUrl: websiteUrl.trim() || undefined,
        imageUrls,
      });

      Alert.alert(t('eventCreated'), '', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert(t('error'), err.message || t('error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.form}>
        {/* Basic Info */}
        <Text style={styles.sectionTitle}>{t('basicInfo')}</Text>

        <Text style={styles.label}>{t('eventTitle')} *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder={t('eventTitlePlaceholder')}
          maxLength={255}
        />

        <Text style={styles.label}>{t('eventTypeLabel')}</Text>
        <View style={styles.chipRow}>
          {EVENT_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.chip, eventType === type && styles.chipActive]}
              onPress={() => setEventType(type)}
            >
              <Text style={[styles.chipText, eventType === type && styles.chipTextActive]}>
                {t(type)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{t('description')}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder={t('descriptionPlaceholder')}
          multiline
          maxLength={5000}
          textAlignVertical="top"
        />

        {/* Venue & Location */}
        <Text style={styles.sectionTitle}>{t('venueLocation')}</Text>

        <Text style={styles.label}>{t('venue')} *</Text>
        <TextInput style={styles.input} value={venueName} onChangeText={setVenueName} placeholder={t('venuePlaceholder')} />

        <Text style={styles.label}>{t('address')}</Text>
        <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder={t('addressPlaceholder')} />

        <Text style={styles.label}>{t('city')} *</Text>
        <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder={t('cityPlaceholder')} />

        <Text style={styles.label}>{t('country')}</Text>
        <View style={styles.chipRow}>
          {COUNTRIES.map((code) => (
            <TouchableOpacity
              key={code}
              style={[styles.chipSmall, countryCode === code && styles.chipActive]}
              onPress={() => setCountryCode(code)}
            >
              <Text style={[styles.chipText, countryCode === code && styles.chipTextActive]}>{code}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date & Time */}
        <Text style={styles.sectionTitle}>{t('dateTime')}</Text>

        <Text style={styles.label}>{t('startDateTime')} *</Text>
        <TextInput
          style={styles.input}
          value={startDatetime}
          onChangeText={setStartDatetime}
          placeholder="2025-01-15T20:00"
        />

        <Text style={styles.label}>{t('endDateTime')}</Text>
        <TextInput
          style={styles.input}
          value={endDatetime}
          onChangeText={setEndDatetime}
          placeholder="2025-01-16T02:00"
        />

        {/* Images */}
        <Text style={styles.sectionTitle}>{t('images')}</Text>
        <View style={styles.imageRow}>
          {images.map((uri, i) => (
            <View key={i} style={styles.imageThumb}>
              <Image source={{ uri }} style={styles.thumbImg} />
              <TouchableOpacity style={styles.removeImg} onPress={() => removeImage(i)}>
                <Text style={styles.removeImgText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          {images.length < 5 && (
            <TouchableOpacity style={styles.addImgBtn} onPress={pickImages}>
              <Text style={styles.addImgText}>+</Text>
              <Text style={styles.addImgLabel}>{t('addImage')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Capacity & Registration */}
        <Text style={styles.sectionTitle}>{t('capacityRegistration')}</Text>

        <Text style={styles.label}>{t('maxParticipants')}</Text>
        <TextInput style={styles.input} value={maxParticipants} onChangeText={setMaxParticipants} placeholder="100" keyboardType="numeric" />

        <Text style={styles.label}>{t('registrationDeadline')}</Text>
        <TextInput style={styles.input} value={registrationDeadline} onChangeText={setRegistrationDeadline} placeholder="2025-01-14T23:59" />

        {/* Additional Details */}
        <Text style={styles.sectionTitle}>{t('additionalDetails')}</Text>

        <Text style={styles.label}>{t('price')}</Text>
        <View style={styles.priceRow}>
          <TextInput style={[styles.input, { flex: 1 }]} value={price} onChangeText={setPrice} placeholder="0" keyboardType="numeric" />
          <TextInput style={[styles.input, { width: 80, marginLeft: 8 }]} value={currency} onChangeText={setCurrency} placeholder="USD" />
        </View>

        <Text style={styles.label}>{t('organizerName')}</Text>
        <TextInput style={styles.input} value={organizerName} onChangeText={setOrganizerName} placeholder={t('organizerNamePlaceholder')} />

        <Text style={styles.label}>{t('organizerContact')} *</Text>
        <TextInput style={styles.input} value={organizerContact} onChangeText={setOrganizerContact} placeholder={t('organizerContactPlaceholder')} keyboardType="email-address" />

        <Text style={styles.label}>{t('websiteUrl')}</Text>
        <TextInput style={styles.input} value={websiteUrl} onChangeText={setWebsiteUrl} placeholder="https://" keyboardType="url" />

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>{t('createEvent')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const createStyles = (c: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  form: { padding: 16, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: c.primary,
    marginTop: 24,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  label: { fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: c.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: c.border,
    padding: 12,
    fontSize: 15,
    color: c.text,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: c.border,
  },
  chipSmall: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: c.border,
  },
  chipActive: { backgroundColor: c.primary },
  chipText: { fontSize: 13, color: c.text, fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  imageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  imageThumb: { width: 80, height: 80, borderRadius: 8, overflow: 'hidden' },
  thumbImg: { width: '100%', height: '100%' },
  removeImg: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImgText: { color: '#fff', fontSize: 12 },
  addImgBtn: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: c.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImgText: { fontSize: 24, color: c.textTertiary },
  addImgLabel: { fontSize: 10, color: c.textTertiary },
  priceRow: { flexDirection: 'row', alignItems: 'center' },
  submitBtn: {
    backgroundColor: c.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
