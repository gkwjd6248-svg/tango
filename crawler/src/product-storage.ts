import { Pool, PoolClient } from 'pg';
import pino from 'pino';
import { ExtractedProduct } from './product-types';
import { config } from './config';

const logger = pino({ name: 'product-storage' });

// Reuse a dedicated pool for the product crawler.
// Keeping this separate from storage.ts avoids cross-contaminating pool state
// when both event and product crawlers run in the same process.
const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
  max: 10,
});

/**
 * Inserts a new product deal or updates an existing one.
 *
 * Dedup key: affiliate_url — if the same affiliate URL is encountered again the
 * row is refreshed with the latest prices, images, and expiry.
 *
 * Returns 'created' | 'updated'.
 */
export async function upsertProductDeal(
  product: ExtractedProduct,
): Promise<'created' | 'updated'> {
  // affiliate_url must be present at this point (set by buildAffiliateUrl in the extractor)
  const affiliateUrl = product.affiliate_url ?? product.source_url;

  const client: PoolClient = await pool.connect();
  try {
    const existing = await client.query<{ id: string }>(
      `SELECT id FROM product_deals WHERE affiliate_url = $1 LIMIT 1`,
      [affiliateUrl],
    );

    if (existing.rows.length > 0) {
      await client.query(
        `UPDATE product_deals SET
          title               = $1,
          description         = $2,
          product_category    = $3,
          original_price      = $4,
          deal_price          = $5,
          currency            = $6,
          image_urls          = $7,
          is_active           = TRUE,
          expires_at          = $8,
          updated_at          = NOW()
         WHERE id = $9`,
        [
          product.title,
          product.description ?? null,
          product.product_category,
          product.original_price,
          product.deal_price,
          product.currency,
          JSON.stringify(product.image_urls ?? []),
          product.expires_at ?? null,
          existing.rows[0].id,
        ],
      );
      logger.debug({ affiliateUrl, title: product.title }, 'Product deal updated');
      return 'updated';
    }

    await client.query(
      `INSERT INTO product_deals (
        title, description, product_category,
        original_price, deal_price, currency,
        affiliate_provider, affiliate_url, affiliate_id,
        image_urls, is_active, expires_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE,$11)`,
      [
        product.title,
        product.description ?? null,
        product.product_category,
        product.original_price,
        product.deal_price,
        product.currency,
        product.affiliate_provider,
        affiliateUrl,
        product.affiliate_id ?? null,
        JSON.stringify(product.image_urls ?? []),
        product.expires_at ?? null,
      ],
    );
    logger.info({ title: product.title, provider: product.affiliate_provider }, 'New product deal created');
    return 'created';
  } finally {
    client.release();
  }
}

/**
 * Marks all deals whose expires_at timestamp is in the past as inactive.
 * Should be called once per crawl cycle, after all upserts complete.
 *
 * Returns the number of rows deactivated.
 */
export async function deactivateExpiredDeals(): Promise<number> {
  const result = await pool.query<{ count: string }>(
    `UPDATE product_deals
     SET is_active = FALSE, updated_at = NOW()
     WHERE is_active = TRUE
       AND expires_at IS NOT NULL
       AND expires_at < NOW()
     RETURNING id`,
  );
  const count = result.rowCount ?? 0;
  if (count > 0) {
    logger.info({ deactivated: count }, 'Expired product deals deactivated');
  }
  return count;
}

/**
 * Returns the total number of currently active product deals across all providers.
 * Useful for health-check logging at the end of a crawl cycle.
 */
export async function getActiveDealsCount(): Promise<number> {
  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM product_deals WHERE is_active = TRUE`,
  );
  return parseInt(result.rows[0].count, 10);
}

export async function closeProductPool(): Promise<void> {
  await pool.end();
}
