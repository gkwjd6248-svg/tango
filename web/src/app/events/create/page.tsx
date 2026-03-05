'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft, FaCheck, FaCamera, FaTimes } from 'react-icons/fa';
import { AuthGuard } from '@/components/AuthGuard';
import { eventsApi } from '@/lib/api/events';
import { useTranslation } from '@/lib/i18n';

// ─── Types & constants ────────────────────────────────────────────────────────

type EventType = 'milonga' | 'festival' | 'workshop' | 'class' | 'practica';

interface EventTypeOption {
  value: EventType;
  label: string;
}

const EVENT_TYPE_OPTIONS: EventTypeOption[] = [
  { value: 'milonga', label: 'Milonga' },
  { value: 'festival', label: 'Festival' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'class', label: 'Class' },
  { value: 'practica', label: 'Practica' },
];

/** Common tango country codes. Labels are resolved via i18n. */
const COUNTRY_CODES_CREATE = [
  'AR', 'KR', 'JP', 'DE', 'FR', 'IT', 'ES', 'US', 'GB', 'FI',
  'BR', 'CL', 'UY', 'MX', 'NL', 'PL', 'AU', 'TR',
] as const;

const COUNTRY_KEY_MAP: Record<string, string> = {
  AR: 'countryAR', KR: 'countryKR', JP: 'countryJP', DE: 'countryDE',
  FR: 'countryFR', IT: 'countryIT', ES: 'countryES', US: 'countryUS',
  GB: 'countryGB', FI: 'countryFI', BR: 'countryBR', CL: 'countryCL',
  UY: 'countryUY', MX: 'countryMX', NL: 'countryNL', PL: 'countryPL',
  AU: 'countryAU', TR: 'countryTR',
};

// ─── Field label helper ───────────────────────────────────────────────────────

function FieldLabel({
  htmlFor,
  label,
  required,
}: {
  htmlFor: string;
  label: string;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-bold text-primary-700 dark:text-primary-400 uppercase tracking-wider mb-1.5"
    >
      {label}
      {required && (
        <span className="ml-1 text-red-500" aria-label="required">
          *
        </span>
      )}
    </label>
  );
}

// ─── Shared input class ───────────────────────────────────────────────────────

const INPUT_CLASS =
  'w-full rounded-lg border border-warm-200 dark:border-warm-700 px-4 py-2.5 text-sm text-warm-900 dark:text-warm-100 ' +
  'bg-white dark:bg-warm-900 placeholder:text-warm-300 dark:placeholder:text-warm-600 focus:outline-none focus:ring-2 ' +
  'focus:ring-primary-700/20 focus:border-primary-700 transition-all';

const SELECT_CLASS =
  'w-full rounded-lg border border-warm-200 dark:border-warm-700 px-4 py-2.5 text-sm text-warm-900 dark:text-warm-100 ' +
  'bg-white dark:bg-warm-900 focus:outline-none focus:ring-2 ' +
  'focus:ring-primary-700/20 focus:border-primary-700 transition-all cursor-pointer';

// ─── Inner form (rendered after AuthGuard passes) ─────────────────────────────

function CreateEventForm() {
  const router = useRouter();
  const { t } = useTranslation();

  // ── Form state ─────────────────────────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<EventType>('milonga');
  const [description, setDescription] = useState('');
  const [venueName, setVenueName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [countryCode, setCountryCode] = useState('AR');
  const [startDatetime, setStartDatetime] = useState('');
  const [endDatetime, setEndDatetime] = useState('');
  const [priceInfo, setPriceInfo] = useState('');
  const [currency, setCurrency] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [organizerContact, setOrganizerContact] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // ── Submission state ───────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Image handlers ─────────────────────────────────────────────────────────
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + imageFiles.length > 5) {
      setError(t.events.maxImages);
      return;
    }
    const newFiles = [...imageFiles, ...files];
    setImageFiles(newFiles);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const canSubmit =
    title.trim().length > 0 &&
    venueName.trim().length > 0 &&
    city.trim().length > 0 &&
    countryCode.length === 2 &&
    startDatetime.length > 0 &&
    organizerContact.trim().length > 0 &&
    !isSubmitting;

  // ── Submit handler ─────────────────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Upload images first if any
      let imageUrls: string[] | undefined;
      if (imageFiles.length > 0) {
        const uploadResult = await eventsApi.uploadImages(imageFiles);
        imageUrls = uploadResult.urls;
      }

      await eventsApi.createEvent({
        title: title.trim(),
        eventType,
        description: description.trim() || undefined,
        venueName: venueName.trim(),
        address: address.trim() || undefined,
        city: city.trim(),
        countryCode,
        startDatetime,
        endDatetime: endDatetime || undefined,
        priceInfo: priceInfo.trim() || undefined,
        currency: currency.trim() || undefined,
        organizerName: organizerName.trim() || undefined,
        organizerContact: organizerContact.trim(),
        websiteUrl: websiteUrl.trim() || undefined,
        imageUrls,
        maxParticipants: maxParticipants ? parseInt(maxParticipants, 10) : undefined,
        registrationDeadline: registrationDeadline || undefined,
      });

      router.push('/events');
    } catch (err: unknown) {
      const msg =
        typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to register event. Please try again.';
      setError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container py-8">
      <div className="max-w-2xl mx-auto">
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/events"
            className="flex items-center gap-2 text-warm-500 dark:text-warm-400 hover:text-warm-800 dark:hover:text-warm-200
                       text-sm transition-colors"
            aria-label="Back to events"
          >
            <FaArrowLeft size={12} />
            {t.nav.events}
          </Link>
          <span className="text-warm-300 dark:text-warm-600" aria-hidden="true">
            /
          </span>
          <h1 className="text-lg font-bold text-warm-950 dark:text-warm-100">{t.events.createEventTitle}</h1>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* ── Basic Info ─────────────────────────────────────────── */}
          <section className="bg-white dark:bg-warm-900 rounded-xl border border-warm-100 dark:border-warm-800 p-5 mb-4">
            <h2 className="text-xs font-bold text-primary-700 dark:text-primary-400 uppercase tracking-wider mb-4">
              {t.events.basicInfo}
            </h2>

            {/* Title */}
            <div className="mb-4">
              <FieldLabel htmlFor="event-title" label={t.events.formTitle} required />
              <input
                id="event-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t.events.formTitlePlaceholder}
                className={INPUT_CLASS}
                maxLength={255}
                aria-required="true"
                autoFocus
              />
            </div>

            {/* Event Type */}
            <div className="mb-4">
              <FieldLabel htmlFor="event-type" label={t.events.formEventType} required />
              <select
                id="event-type"
                value={eventType}
                onChange={(e) => setEventType(e.target.value as EventType)}
                className={SELECT_CLASS}
                aria-required="true"
              >
                {EVENT_TYPE_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <FieldLabel htmlFor="event-description" label={t.events.formDescription} />
              <textarea
                id="event-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.events.formDescriptionPlaceholder}
                rows={4}
                className={`${INPUT_CLASS} resize-none leading-relaxed`}
                maxLength={5000}
              />
            </div>
          </section>

          {/* ── Venue & Location ───────────────────────────────────── */}
          <section className="bg-white dark:bg-warm-900 rounded-xl border border-warm-100 dark:border-warm-800 p-5 mb-4">
            <h2 className="text-xs font-bold text-primary-700 dark:text-primary-400 uppercase tracking-wider mb-4">
              {t.events.venueLocation}
            </h2>

            {/* Venue Name */}
            <div className="mb-4">
              <FieldLabel htmlFor="event-venue" label={t.events.formVenueName} required />
              <input
                id="event-venue"
                type="text"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder={t.events.formVenueNamePlaceholder}
                className={INPUT_CLASS}
                maxLength={255}
                aria-required="true"
              />
            </div>

            {/* Address */}
            <div className="mb-4">
              <FieldLabel htmlFor="event-address" label={t.events.formAddress} />
              <input
                id="event-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t.events.formAddressPlaceholder}
                className={INPUT_CLASS}
                maxLength={500}
              />
            </div>

            {/* City + Country — side by side on sm+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel htmlFor="event-city" label={t.events.formCity} required />
                <input
                  id="event-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={t.events.formCityPlaceholder}
                  className={INPUT_CLASS}
                  maxLength={100}
                  aria-required="true"
                />
              </div>

              <div>
                <FieldLabel htmlFor="event-country" label={t.events.formCountry} required />
                <select
                  id="event-country"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className={SELECT_CLASS}
                  aria-required="true"
                >
                  {COUNTRY_CODES_CREATE.map((code) => (
                    <option key={code} value={code}>
                      {(t.events as Record<string, string>)[COUNTRY_KEY_MAP[code]] ?? code}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* ── Date & Time ────────────────────────────────────────── */}
          <section className="bg-white dark:bg-warm-900 rounded-xl border border-warm-100 dark:border-warm-800 p-5 mb-4">
            <h2 className="text-xs font-bold text-primary-700 dark:text-primary-400 uppercase tracking-wider mb-4">
              {t.events.dateTime}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel htmlFor="event-start" label={t.events.formStartDatetime} required />
                <input
                  id="event-start"
                  type="datetime-local"
                  value={startDatetime}
                  onChange={(e) => setStartDatetime(e.target.value)}
                  className={INPUT_CLASS}
                  aria-required="true"
                />
              </div>

              <div>
                <FieldLabel htmlFor="event-end" label={t.events.formEndDatetime} />
                <input
                  id="event-end"
                  type="datetime-local"
                  value={endDatetime}
                  min={startDatetime || undefined}
                  onChange={(e) => setEndDatetime(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          </section>

          {/* ── Images ─────────────────────────────────────────────── */}
          <section className="bg-white dark:bg-warm-900 rounded-xl border border-warm-100 dark:border-warm-800 p-5 mb-4">
            <h2 className="text-xs font-bold text-primary-700 dark:text-primary-400 uppercase tracking-wider mb-4">
              {t.events.formImages}
            </h2>
            <div className="mb-3">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
                id="event-images"
              />
              <label
                htmlFor="event-images"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed
                           border-warm-300 dark:border-warm-600 text-warm-600 dark:text-warm-400 text-sm cursor-pointer
                           hover:border-primary-700 hover:text-primary-700 dark:hover:border-primary-400 dark:hover:text-primary-400 transition-all"
              >
                <FaCamera size={14} />
                {t.events.addImages}
              </label>
              <span className="text-xs text-warm-400 ml-3">
                {t.events.maxImages}
              </span>
            </div>
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-warm-100 dark:bg-warm-800">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white
                                 flex items-center justify-center text-xs hover:bg-red-700"
                      aria-label="Remove image"
                    >
                      <FaTimes size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Capacity & Deadline ──────────────────────────────────── */}
          <section className="bg-white dark:bg-warm-900 rounded-xl border border-warm-100 dark:border-warm-800 p-5 mb-4">
            <h2 className="text-xs font-bold text-primary-700 dark:text-primary-400 uppercase tracking-wider mb-4">
              {t.events.participants}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel htmlFor="event-max-participants" label={t.events.formMaxParticipants} />
                <input
                  id="event-max-participants"
                  type="number"
                  min="1"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                  placeholder={t.events.formMaxParticipantsPlaceholder}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <FieldLabel htmlFor="event-reg-deadline" label={t.events.formRegistrationDeadline} />
                <input
                  id="event-reg-deadline"
                  type="datetime-local"
                  value={registrationDeadline}
                  max={startDatetime || undefined}
                  onChange={(e) => setRegistrationDeadline(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          </section>

          {/* ── Details ────────────────────────────────────────────── */}
          <section className="bg-white dark:bg-warm-900 rounded-xl border border-warm-100 dark:border-warm-800 p-5 mb-6">
            <h2 className="text-xs font-bold text-primary-700 dark:text-primary-400 uppercase tracking-wider mb-4">
              {t.events.additionalDetails}
            </h2>

            {/* Price Info + Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="sm:col-span-2">
                <FieldLabel htmlFor="event-price" label={t.events.formPriceInfo} />
                <input
                  id="event-price"
                  type="text"
                  value={priceInfo}
                  onChange={(e) => setPriceInfo(e.target.value)}
                  placeholder={t.events.formPriceInfoPlaceholder}
                  className={INPUT_CLASS}
                  maxLength={255}
                />
              </div>

              <div>
                <FieldLabel htmlFor="event-currency" label={t.events.formCurrency} />
                <input
                  id="event-currency"
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                  placeholder={t.events.formCurrencyPlaceholder}
                  className={INPUT_CLASS}
                  maxLength={10}
                />
              </div>
            </div>

            {/* Organizer Name */}
            <div className="mb-4">
              <FieldLabel htmlFor="event-organizer" label={t.events.formOrganizerName} />
              <input
                id="event-organizer"
                type="text"
                value={organizerName}
                onChange={(e) => setOrganizerName(e.target.value)}
                placeholder={t.events.formOrganizerNamePlaceholder}
                className={INPUT_CLASS}
                maxLength={255}
              />
            </div>

            {/* Organizer Contact */}
            <div className="mb-4">
              <FieldLabel htmlFor="event-organizer-contact" label={t.events.formOrganizerContact} required />
              <input
                id="event-organizer-contact"
                type="text"
                value={organizerContact}
                onChange={(e) => setOrganizerContact(e.target.value)}
                placeholder={t.events.formOrganizerContactPlaceholder}
                className={INPUT_CLASS}
                maxLength={255}
                aria-required="true"
              />
            </div>

            {/* Website URL */}
            <div>
              <FieldLabel htmlFor="event-website" label={t.events.formWebsiteUrl} />
              <input
                id="event-website"
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder={t.events.formWebsiteUrlPlaceholder}
                className={INPUT_CLASS}
                maxLength={500}
              />
            </div>
          </section>

          {/* ── Error message ──────────────────────────────────────── */}
          {error && (
            <p
              role="alert"
              className="mb-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800
                         text-red-700 dark:text-red-300 text-sm"
            >
              {error}
            </p>
          )}

          {/* ── Action buttons ─────────────────────────────────────── */}
          <div className="flex items-center gap-3">
            <Link
              href="/events"
              className="btn-secondary flex-1 justify-center"
              aria-label="Cancel and go back to events"
            >
              {t.community.cancel}
            </Link>

            <button
              type="submit"
              disabled={!canSubmit}
              className="btn-primary flex-[2] justify-center"
              aria-label="Submit event registration"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  {t.events.submittingEvent}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <FaCheck size={13} />
                  {t.events.submitEvent}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page — wrapped with AuthGuard ───────────────────────────────────────────

export default function CreateEventPage() {
  return (
    <AuthGuard>
      <CreateEventForm />
    </AuthGuard>
  );
}
