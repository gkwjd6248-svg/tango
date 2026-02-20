import Anthropic from '@anthropic-ai/sdk';
import { chromium, Browser, Page } from 'playwright';
import * as cheerio from 'cheerio';
import pino from 'pino';
import {
  ExtractedHotel,
  ExtractedHotelSchema,
  EventForEnrichment,
  HotelEnrichmentResult,
  DirectionsInfo,
  EnrichmentSummary,
} from './hotel-types';
import { upsertHotelAffiliate, getEventsWithoutHotels } from './hotel-storage';
import { config } from './config';

const logger = pino({ name: 'hotel-enricher' });

// Affiliate IDs — set via environment variables or fall back to placeholder values
const BOOKING_AID = process.env.BOOKING_COM_AID || '123456';
const AGODA_CID   = process.env.AGODA_CID        || '1234567';

const anthropic = new Anthropic({ apiKey: config.anthropic.apiKey });

// ─── Browser singleton ────────────────────────────────────────────────────────

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browser;
}

export async function closeEnricherBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

// ─── Haversine distance ───────────────────────────────────────────────────────

/**
 * Calculate the great-circle distance between two WGS-84 coordinates.
 * Returns the distance in metres.
 */
function haversineMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6_371_000; // Earth radius in metres
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Rate limiting ────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Affiliate URL builders ───────────────────────────────────────────────────

/**
 * Build a Booking.com affiliate search URL for a free-text location query.
 * Uses the official affiliate link format with AID tracking parameter.
 */
function buildBookingSearchUrl(query: string, checkIn: Date): string {
  const ci = checkIn.toISOString().substring(0, 10);
  // Check-out = check-in + 1 night as default
  const coDate = new Date(checkIn);
  coDate.setDate(coDate.getDate() + 1);
  const co = coDate.toISOString().substring(0, 10);

  const params = new URLSearchParams({
    ss: query,
    checkin: ci,
    checkout: co,
    group_adults: '2',
    no_rooms: '1',
    aid: BOOKING_AID,
  });
  return `https://www.booking.com/search.html?${params.toString()}`;
}

/**
 * Build an Agoda affiliate search URL.
 */
function buildAgodaSearchUrl(query: string, checkIn: Date): string {
  const ci = checkIn.toISOString().substring(0, 10);
  const coDate = new Date(checkIn);
  coDate.setDate(coDate.getDate() + 1);
  const co = coDate.toISOString().substring(0, 10);

  const params = new URLSearchParams({
    city: query,
    checkIn: ci,
    checkOut: co,
    adults: '2',
    rooms: '1',
    cid: AGODA_CID,
  });
  return `https://www.agoda.com/search?${params.toString()}`;
}

/**
 * Build a deep-link affiliate URL to a specific hotel on Booking.com.
 */
function buildBookingHotelUrl(hotelName: string, _countryCode: string): string {
  // Normalise hotel name for URL slug
  const slug = hotelName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `https://www.booking.com/hotel/xx/${slug}.html?aid=${BOOKING_AID}`;
}

/**
 * Build a deep-link affiliate URL to a specific hotel on Agoda.
 */
function buildAgodaHotelUrl(hotelName: string): string {
  const slug = hotelName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `https://www.agoda.com/hotel/${slug}?cid=${AGODA_CID}`;
}

// ─── Scraping helpers ─────────────────────────────────────────────────────────

/**
 * Fetch a page with Playwright and return cleaned text content.
 * Handles cookie-consent overlays with a best-effort dismiss.
 */
async function fetchPageText(url: string): Promise<string> {
  const b = await getBrowser();
  const page: Page = await b.newPage({
    userAgent: config.crawler.userAgent,
  });

  try {
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: config.crawler.timeoutMs,
    });

    // Dismiss common cookie banners
    for (const selector of [
      '#onetrust-accept-btn-handler',
      'button[id*="accept"]',
      'button[class*="accept"]',
      '[data-testid="accept-cookie"]',
    ]) {
      await page.click(selector, { timeout: 3000 }).catch(() => {/* not present */});
    }

    // Wait briefly for dynamic content
    await page.waitForTimeout(2000);

    const html = await page.content();
    return cleanHtmlForExtraction(html);
  } finally {
    await page.close();
  }
}

/**
 * Strip boilerplate HTML, keeping only text useful for AI extraction.
 */
function cleanHtmlForExtraction(html: string): string {
  const $ = cheerio.load(html);
  $('script, style, noscript, iframe, svg, link, meta, nav, footer, header').remove();
  $('[class*="cookie"], [class*="popup"], [class*="banner"], [id*="cookie"]').remove();

  let content = $('body').text();
  content = content.replace(/\s+/g, ' ').trim();

  // Cap at 80k characters to stay within Claude's context window
  return content.length > 80_000 ? content.substring(0, 80_000) : content;
}

// ─── Claude AI helpers ────────────────────────────────────────────────────────

/**
 * Ask Claude to generate a good hotel search query for a given event.
 */
async function generateHotelSearchQuery(event: EventForEnrichment): Promise<string> {
  const venue = event.venue_name ? `${event.venue_name}, ` : '';
  const address = event.address ? `${event.address}, ` : '';

  const prompt = `Generate a concise hotel search query (max 60 characters) for guests attending a tango event at:
Venue: ${venue}${address}${event.city}, ${event.country_code}

The query should be suitable for entering into Booking.com or Agoda search.
Return ONLY the search query string, nothing else.`;

  const response = await anthropic.messages.create({
    model: config.anthropic.model,
    max_tokens: 100,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content.find((b) => b.type === 'text');
  return text?.type === 'text' ? text.text.trim() : `${event.city} hotels`;
}

/**
 * Ask Claude to extract structured hotel data from raw page text.
 * Returns up to `maxHotels` hotels.
 */
async function extractHotelsWithClaude(
  pageText: string,
  provider: 'booking_com' | 'agoda',
  event: EventForEnrichment,
  maxHotels = 5,
): Promise<ExtractedHotel[]> {
  const systemPrompt = `You are a hotel data extraction AI. Extract hotel listings from search result page text.

Return a JSON array (max ${maxHotels} items). Each object must have:
- hotel_name: string (required)
- hotel_address: string or null
- latitude: number or null
- longitude: number or null
- price_per_night_min: number or null (numeric, no currency symbol)
- currency: 3-letter ISO code, default "USD"
- rating: number 0-10 or null
- review_count: integer, default 0
- affiliate_provider: "${provider}"
- affiliate_url: string (valid URL)
- affiliate_id: string or null
- image_url: string or null
- amenities: string array

Rules:
- Return ONLY a valid JSON array, no markdown, no explanation
- affiliate_url must start with https://
- If fewer than ${maxHotels} hotels are clearly visible, return what you find
- If nothing found, return []`;

  const userPrompt = `Extract hotels from this ${provider === 'booking_com' ? 'Booking.com' : 'Agoda'} search result page.
The search was for hotels near: ${event.venue_name ?? event.address ?? event.city}, ${event.city}, ${event.country_code}

---PAGE TEXT START---
${pageText}
---PAGE TEXT END---

Return a JSON array of hotel objects.`;

  try {
    const response = await anthropic.messages.create({
      model: config.anthropic.model,
      max_tokens: config.anthropic.maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') return [];

    const raw = textBlock.text.trim();
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed: unknown = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return [];

    const hotels: ExtractedHotel[] = [];
    for (const item of parsed) {
      const result = ExtractedHotelSchema.safeParse(item);
      if (result.success) {
        hotels.push(result.data);
      } else {
        logger.warn({ errors: result.error.issues, hotelName: (item as Record<string, unknown>).hotel_name }, 'Hotel validation failed, skipping');
      }
    }
    return hotels;
  } catch (err) {
    logger.error({ err }, 'Claude hotel extraction failed');
    return [];
  }
}

/**
 * Use Claude to generate directions / transit information for an event venue.
 */
async function generateDirectionsWithClaude(event: EventForEnrichment): Promise<DirectionsInfo | null> {
  const venue = event.venue_name ? `${event.venue_name}, ` : '';
  const address = event.address ? `${event.address}, ` : '';

  const prompt = `Generate practical directions and transit information for guests attending a tango event at:
${venue}${address}${event.city}, ${event.country_code}

Return a single JSON object with exactly these fields:
{
  "summary": "Plain-English 2-3 sentence overview of how to get there",
  "transitOptions": [
    {
      "type": "metro|bus|tram|train|ferry|other",
      "line": "Line name or number",
      "stopName": "Nearest stop name",
      "walkingMinutes": integer
    }
  ],
  "walkingTimeFromTransitMinutes": integer or null,
  "drivingTimeFromCenterMinutes": integer or null,
  "parkingNotes": "string or null",
  "language": "en"
}

Return ONLY the JSON object, no markdown, no extra text.
Base the information on your knowledge of ${event.city}. If uncertain, use reasonable estimates.`;

  try {
    const response = await anthropic.messages.create({
      model: config.anthropic.model,
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') return null;

    const raw = textBlock.text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]) as DirectionsInfo;
  } catch (err) {
    logger.error({ err, eventId: event.id }, 'Claude directions generation failed');
    return null;
  }
}

// ─── Core enrichment functions ────────────────────────────────────────────────

/**
 * Enrich a single event with hotels from both Booking.com and Agoda.
 * Scrapes up to 5 hotels from each provider, deduplicates by name,
 * calculates distance from event, then upserts to hotel_affiliates.
 */
export async function enrichEventWithHotels(
  event: EventForEnrichment,
): Promise<HotelEnrichmentResult> {
  const startTime = Date.now();
  const result: HotelEnrichmentResult = {
    eventId: event.id,
    eventTitle: event.title,
    hotelsFound: 0,
    hotelsUpserted: 0,
    errors: [],
    durationMs: 0,
  };

  logger.info({ eventId: event.id, title: event.title, city: event.city }, 'Enriching event with hotels');

  try {
    // Step 1: generate a search query via Claude
    const searchQuery = await generateHotelSearchQuery(event);
    logger.debug({ eventId: event.id, searchQuery }, 'Hotel search query generated');

    const checkIn = new Date(event.start_datetime);
    const allHotels: ExtractedHotel[] = [];

    // Step 2: scrape Booking.com
    try {
      const bookingUrl = buildBookingSearchUrl(searchQuery, checkIn);
      logger.debug({ bookingUrl }, 'Fetching Booking.com results');
      const bookingText = await fetchPageText(bookingUrl);
      await delay(config.crawler.requestDelayMs);

      const bookingHotels = await extractHotelsWithClaude(bookingText, 'booking_com', event);

      // Ensure each hotel has a valid affiliate URL
      for (const h of bookingHotels) {
        if (!h.affiliate_url || !h.affiliate_url.startsWith('https://')) {
          h.affiliate_url = buildBookingHotelUrl(h.hotel_name, event.country_code);
        }
        allHotels.push(h);
      }
      logger.debug({ count: bookingHotels.length }, 'Booking.com hotels extracted');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`Booking.com scrape failed: ${msg}`);
      logger.error({ err, eventId: event.id }, 'Booking.com scrape error');
    }

    await delay(config.crawler.requestDelayMs);

    // Step 3: scrape Agoda
    try {
      const agodaUrl = buildAgodaSearchUrl(searchQuery, checkIn);
      logger.debug({ agodaUrl }, 'Fetching Agoda results');
      const agodaText = await fetchPageText(agodaUrl);
      await delay(config.crawler.requestDelayMs);

      const agodaHotels = await extractHotelsWithClaude(agodaText, 'agoda', event);

      for (const h of agodaHotels) {
        if (!h.affiliate_url || !h.affiliate_url.startsWith('https://')) {
          h.affiliate_url = buildAgodaHotelUrl(h.hotel_name);
        }
        allHotels.push(h);
      }
      logger.debug({ count: agodaHotels.length }, 'Agoda hotels extracted');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`Agoda scrape failed: ${msg}`);
      logger.error({ err, eventId: event.id }, 'Agoda scrape error');
    }

    result.hotelsFound = allHotels.length;

    // Step 4: calculate distances and upsert
    for (const hotel of allHotels) {
      if (hotel.latitude != null && hotel.longitude != null) {
        hotel.distance_from_event_meters = Math.round(
          haversineMeters(event.latitude, event.longitude, hotel.latitude, hotel.longitude),
        );
      }

      try {
        await upsertHotelAffiliate(hotel, event.id);
        result.hotelsUpserted++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        result.errors.push(`Upsert failed for "${hotel.hotel_name}": ${msg}`);
        logger.error({ err, hotelName: hotel.hotel_name }, 'Hotel upsert failed');
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.errors.push(msg);
    logger.error({ err, eventId: event.id }, 'Hotel enrichment failed');
  }

  result.durationMs = Date.now() - startTime;
  logger.info(
    {
      eventId: event.id,
      hotelsFound: result.hotelsFound,
      hotelsUpserted: result.hotelsUpserted,
      errors: result.errors.length,
      durationMs: result.durationMs,
    },
    'Hotel enrichment complete',
  );

  return result;
}

/**
 * Generate and log directions for a single event using Claude AI.
 * Returns the DirectionsInfo or null if generation failed.
 */
export async function enrichEventWithDirections(
  event: EventForEnrichment,
): Promise<DirectionsInfo | null> {
  logger.info({ eventId: event.id, city: event.city }, 'Generating directions');

  const directions = await generateDirectionsWithClaude(event);

  if (directions) {
    logger.info(
      {
        eventId: event.id,
        transitOptions: directions.transitOptions.length,
        walkingMins: directions.walkingTimeFromTransitMinutes,
      },
      'Directions generated',
    );
  }

  return directions;
}

/**
 * Main entry point: enrich all events that lack hotel data.
 * Processes events sequentially with rate-limit delays between each.
 */
export async function enrichAllEvents(): Promise<EnrichmentSummary> {
  const startTime = Date.now();
  logger.info('=== Starting hotel enrichment cycle ===');

  const summary: EnrichmentSummary = {
    eventsProcessed: 0,
    eventsSucceeded: 0,
    eventsFailed: 0,
    totalHotelsUpserted: 0,
    durationMs: 0,
    errors: [],
  };

  let events: EventForEnrichment[];
  try {
    events = await getEventsWithoutHotels(50);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    summary.errors.push(`Failed to load events: ${msg}`);
    logger.error({ err }, 'Could not fetch events for enrichment');
    summary.durationMs = Date.now() - startTime;
    return summary;
  }

  logger.info({ eventCount: events.length }, 'Events loaded for hotel enrichment');

  if (events.length === 0) {
    logger.info('No events need hotel enrichment');
    summary.durationMs = Date.now() - startTime;
    return summary;
  }

  for (const event of events) {
    summary.eventsProcessed++;

    const result = await enrichEventWithHotels(event);

    if (result.errors.length > 0 && result.hotelsUpserted === 0) {
      summary.eventsFailed++;
      summary.errors.push(...result.errors.map((e) => `[${event.id}] ${e}`));
    } else {
      summary.eventsSucceeded++;
    }

    summary.totalHotelsUpserted += result.hotelsUpserted;

    // Polite delay between events to avoid hammering affiliate sites
    if (summary.eventsProcessed < events.length) {
      await delay(config.crawler.requestDelayMs * 2);
    }
  }

  summary.durationMs = Date.now() - startTime;

  logger.info(
    {
      eventsProcessed: summary.eventsProcessed,
      eventsSucceeded: summary.eventsSucceeded,
      eventsFailed: summary.eventsFailed,
      totalHotelsUpserted: summary.totalHotelsUpserted,
      durationMs: summary.durationMs,
    },
    '=== Hotel enrichment cycle complete ===',
  );

  return summary;
}

// Allow direct execution: `tsx src/hotel-enricher.ts`
if (require.main === module) {
  enrichAllEvents()
    .then((summary) => {
      logger.info(summary, 'Hotel enrichment finished');
      process.exit(0);
    })
    .catch((err) => {
      logger.fatal({ err }, 'Fatal error in hotel enricher');
      process.exit(1);
    })
    .finally(() => closeEnricherBrowser());
}
