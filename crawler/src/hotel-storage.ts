import { Pool } from 'pg';
import pino from 'pino';
import { ExtractedHotel, EventForEnrichment } from './hotel-types';
import { config } from './config';

const logger = pino({ name: 'hotel-storage' });

// Dedicated pool — storage.ts does not export its pool instance
const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
  max: 5,
});

/**
 * Insert or update a hotel affiliate record.
 * Conflict resolution uses (event_id, hotel_name).
 * The PostGIS `location` column is computed from latitude/longitude server-side.
 */
export async function upsertHotelAffiliate(
  hotel: ExtractedHotel,
  eventId: string,
): Promise<'created' | 'updated'> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check for existing row
    const existing = await client.query<{ id: string }>(
      `SELECT id FROM hotel_affiliates
       WHERE event_id = $1 AND hotel_name = $2
       LIMIT 1`,
      [eventId, hotel.hotel_name],
    );

    if (existing.rows.length > 0) {
      const id = existing.rows[0].id;

      // Build location expression only when coordinates are present
      const locationExpr =
        hotel.latitude != null && hotel.longitude != null
          ? `ST_SetSRID(ST_MakePoint(${hotel.longitude}, ${hotel.latitude}), 4326)`
          : 'NULL';

      await client.query(
        `UPDATE hotel_affiliates SET
           hotel_address              = $1,
           location                   = ${locationExpr},
           latitude                   = $2,
           longitude                  = $3,
           distance_from_event_meters = $4,
           price_per_night_min        = $5,
           currency                   = $6,
           rating                     = $7,
           review_count               = $8,
           affiliate_provider         = $9,
           affiliate_url              = $10,
           affiliate_id               = $11,
           image_url                  = $12,
           amenities                  = $13,
           updated_at                 = NOW()
         WHERE id = $14`,
        [
          hotel.hotel_address ?? null,              // $1
          hotel.latitude ?? null,                   // $2
          hotel.longitude ?? null,                  // $3
          hotel.distance_from_event_meters ?? null, // $4
          hotel.price_per_night_min ?? null,        // $5
          hotel.currency,                           // $6
          hotel.rating ?? null,                     // $7
          hotel.review_count,                       // $8
          hotel.affiliate_provider,                 // $9
          hotel.affiliate_url,                      // $10
          hotel.affiliate_id ?? null,               // $11
          hotel.image_url ?? null,                  // $12
          JSON.stringify(hotel.amenities),          // $13
          id,                                       // $14
        ],
      );

      await client.query('COMMIT');
      logger.debug({ eventId, hotelName: hotel.hotel_name }, 'Hotel affiliate updated');
      return 'updated';
    }

    // INSERT new record
    const locationExpr =
      hotel.latitude != null && hotel.longitude != null
        ? `ST_SetSRID(ST_MakePoint(${hotel.longitude}, ${hotel.latitude}), 4326)`
        : 'NULL';

    await client.query(
      `INSERT INTO hotel_affiliates (
         event_id,
         hotel_name,
         hotel_address,
         location,
         latitude,
         longitude,
         distance_from_event_meters,
         price_per_night_min,
         currency,
         rating,
         review_count,
         affiliate_provider,
         affiliate_url,
         affiliate_id,
         image_url,
         amenities
       ) VALUES (
         $1, $2, $3, ${locationExpr},
         $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
       )`,
      [
        eventId,                                    // $1
        hotel.hotel_name,                           // $2
        hotel.hotel_address ?? null,                // $3
        hotel.latitude ?? null,                     // $4
        hotel.longitude ?? null,                    // $5
        hotel.distance_from_event_meters ?? null,   // $6
        hotel.price_per_night_min ?? null,          // $7
        hotel.currency,                             // $8
        hotel.rating ?? null,                       // $9
        hotel.review_count,                         // $10
        hotel.affiliate_provider,                   // $11
        hotel.affiliate_url,                        // $12
        hotel.affiliate_id ?? null,                 // $13
        hotel.image_url ?? null,                    // $14
        JSON.stringify(hotel.amenities),            // $15
      ],
    );

    await client.query('COMMIT');
    logger.debug({ eventId, hotelName: hotel.hotel_name }, 'Hotel affiliate created');
    return 'created';
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Find events that have valid coordinates but zero hotel_affiliates rows.
 * Limited to `limit` rows per call to avoid overloading affiliate scrapers.
 */
export async function getEventsWithoutHotels(limit = 50): Promise<EventForEnrichment[]> {
  const result = await pool.query<EventForEnrichment>(
    `SELECT
       e.id,
       e.title,
       e.venue_name,
       e.address,
       e.city,
       e.country_code,
       e.latitude,
       e.longitude,
       e.start_datetime
     FROM events e
     WHERE e.latitude  IS NOT NULL
       AND e.longitude IS NOT NULL
       AND e.status = 'active'
       AND NOT EXISTS (
         SELECT 1
         FROM hotel_affiliates ha
         WHERE ha.event_id = e.id
       )
     ORDER BY e.start_datetime ASC
     LIMIT $1`,
    [limit],
  );

  return result.rows;
}

/**
 * Count how many hotel affiliate rows exist for a given event.
 */
export async function getHotelCountForEvent(eventId: string): Promise<number> {
  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM hotel_affiliates WHERE event_id = $1`,
    [eventId],
  );
  return parseInt(result.rows[0]?.count ?? '0', 10);
}

/**
 * Close the pool during graceful shutdown.
 */
export async function closeHotelPool(): Promise<void> {
  await pool.end();
}
