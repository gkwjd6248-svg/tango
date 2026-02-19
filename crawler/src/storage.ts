import { Pool, PoolClient } from 'pg';
import pino from 'pino';
import { ExtractedEvent, CrawlSource, CrawlLog } from './types';
import { config } from './config';

const logger = pino({ name: 'storage' });

const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
  max: 10,
});

/**
 * 활성 크롤링 소스 목록을 가져옵니다.
 */
export async function getActiveSources(): Promise<CrawlSource[]> {
  const result = await pool.query<CrawlSource>(
    `SELECT id, name, base_url, crawl_frequency, last_crawled_at, is_active, parser_config
     FROM crawl_sources
     WHERE is_active = TRUE
     ORDER BY last_crawled_at ASC NULLS FIRST`,
  );
  return result.rows;
}

/**
 * 크롤링 로그를 생성합니다.
 */
export async function createCrawlLog(sourceId: string): Promise<string> {
  const result = await pool.query<{ id: string }>(
    `INSERT INTO crawl_logs (crawl_source_id, status) VALUES ($1, 'running') RETURNING id`,
    [sourceId],
  );
  return result.rows[0].id;
}

/**
 * 크롤링 로그를 업데이트합니다.
 */
export async function updateCrawlLog(
  logId: string,
  data: Partial<CrawlLog>,
): Promise<void> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (data.status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(data.status);
  }
  if (data.completed_at !== undefined) {
    fields.push(`completed_at = $${paramIndex++}`);
    values.push(data.completed_at);
  }
  if (data.events_found !== undefined) {
    fields.push(`events_found = $${paramIndex++}`);
    values.push(data.events_found);
  }
  if (data.events_created !== undefined) {
    fields.push(`events_created = $${paramIndex++}`);
    values.push(data.events_created);
  }
  if (data.events_updated !== undefined) {
    fields.push(`events_updated = $${paramIndex++}`);
    values.push(data.events_updated);
  }
  if (data.error_log !== undefined) {
    fields.push(`error_log = $${paramIndex++}`);
    values.push(data.error_log);
  }

  if (fields.length === 0) return;

  values.push(logId);
  await pool.query(
    `UPDATE crawl_logs SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
    values,
  );
}

/**
 * 추출된 이벤트를 DB에 upsert합니다.
 * source_url 기준으로 중복을 판단합니다.
 */
export async function upsertEvent(
  event: ExtractedEvent,
  sourceUrl: string,
  crawlSourceId: string,
): Promise<'created' | 'updated' | 'skipped'> {
  const client: PoolClient = await pool.connect();

  try {
    // 기존 이벤트 확인 (source_url 기준)
    const existing = await client.query(
      `SELECT id FROM events WHERE source_url = $1`,
      [sourceUrl],
    );

    if (existing.rows.length > 0) {
      // UPDATE
      await client.query(
        `UPDATE events SET
          title = $1, description = $2, event_type = $3,
          venue_name = $4, address = $5, city = $6, country_code = $7,
          latitude = $8, longitude = $9,
          start_datetime = $10, end_datetime = $11,
          recurrence_rule = $12, organizer_name = $13,
          price_info = $14, currency = $15, image_urls = $16,
          updated_at = NOW()
        WHERE id = $17`,
        [
          event.title, event.description, event.event_type,
          event.venue_name, event.address, event.city, event.country_code,
          event.latitude, event.longitude,
          event.start_datetime, event.end_datetime,
          event.recurrence_rule, event.organizer_name,
          event.price_info, event.currency,
          JSON.stringify(event.image_urls),
          existing.rows[0].id,
        ],
      );
      logger.debug({ eventId: existing.rows[0].id }, 'Event updated');
      return 'updated';
    }

    // 퍼지 중복 체크: 같은 제목 + 같은 날짜 + 같은 도시
    const fuzzyDup = await client.query(
      `SELECT id FROM events
       WHERE city ILIKE $1
         AND start_datetime::date = $2::date
         AND similarity(title, $3) > 0.6
       LIMIT 1`,
      [event.city, event.start_datetime, event.title],
    ).catch(() => ({ rows: [] })); // similarity 확장이 없으면 무시

    if (fuzzyDup.rows.length > 0) {
      logger.debug({ title: event.title, city: event.city }, 'Fuzzy duplicate found, skipping');
      return 'skipped';
    }

    // INSERT
    await client.query(
      `INSERT INTO events (
        title, description, event_type,
        venue_name, address, city, country_code,
        latitude, longitude,
        start_datetime, end_datetime,
        recurrence_rule, source_url, crawl_source_id,
        organizer_name, price_info, currency, image_urls
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
      [
        event.title, event.description, event.event_type,
        event.venue_name, event.address, event.city, event.country_code,
        event.latitude, event.longitude,
        event.start_datetime, event.end_datetime,
        event.recurrence_rule, sourceUrl, crawlSourceId,
        event.organizer_name, event.price_info, event.currency,
        JSON.stringify(event.image_urls),
      ],
    );
    logger.info({ title: event.title, city: event.city }, 'New event created');
    return 'created';
  } finally {
    client.release();
  }
}

/**
 * 크롤링 소스의 last_crawled_at을 업데이트합니다.
 */
export async function updateSourceLastCrawled(sourceId: string): Promise<void> {
  await pool.query(
    `UPDATE crawl_sources SET last_crawled_at = NOW() WHERE id = $1`,
    [sourceId],
  );
}

export async function closePool(): Promise<void> {
  await pool.end();
}
