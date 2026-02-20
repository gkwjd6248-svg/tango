import { z } from 'zod';

// Zod schema for a single extracted product deal — mirrors the product_deals table columns
// that the crawler can populate (discount_percentage is DB-generated, so excluded).
export const ExtractedProductSchema = z.object({
  title: z.string().min(1).max(500),

  description: z.string().nullable().optional(),

  // Must match the product_deals CHECK constraint
  product_category: z.enum(['shoes', 'clothing', 'accessories', 'music', 'other']),

  original_price: z.number().positive(),

  deal_price: z.number().positive(),

  // ISO 4217 three-letter currency code
  currency: z.string().length(3).default('USD'),

  // Provider must match the product_deals CHECK constraint
  affiliate_provider: z.enum(['coupang', 'amazon', 'aliexpress']),

  // The canonical product page URL — used as the dedup key before affiliate wrapping
  source_url: z.string().url(),

  // Affiliate URL is built by the extractor after source_url is known
  affiliate_url: z.string().url().optional(),

  // Affiliate partner / tracking ID embedded in the affiliate_url
  affiliate_id: z.string().nullable().optional(),

  image_urls: z.array(z.string().url()).optional().default([]),

  // ISO 8601 datetime string; null means the deal has no expiry
  expires_at: z.string().nullable().optional(),

  // Extraction confidence: 1.0 = all fields clear, 0.5 = some inference
  confidence: z.number().min(0).max(1).default(0.5),
});

export type ExtractedProduct = z.infer<typeof ExtractedProductSchema>;

// ----------------------------------------------------------------
// Crawl source configuration for shopping sites
// ----------------------------------------------------------------

export interface ProductParserConfig {
  scraper: 'playwright' | 'cheerio';
  // CSS selectors for product list items on the search results page
  selectors?: {
    productList?: string;
    title?: string;
    price?: string;
    originalPrice?: string;
    image?: string;
    link?: string;
  };
  pagination?: {
    type: 'url_param' | 'infinite_scroll' | 'next_button';
    param?: string;
    maxPages?: number;
  };
  // BCP 47 language tag for the page (used as a hint to Claude)
  language?: string;
  // Playwright selector to wait for before capturing HTML
  waitForSelector?: string;
}

export interface ProductCrawlSource {
  id: string;
  name: string;
  base_url: string;
  // Which affiliate provider does this source belong to
  affiliate_provider: 'coupang' | 'amazon' | 'aliexpress';
  // Tango product category this source targets
  product_category: 'shoes' | 'clothing' | 'accessories' | 'music' | 'other';
  crawl_frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  is_active: boolean;
  parser_config: ProductParserConfig;
}

// ----------------------------------------------------------------
// Result type returned by the product crawler per source
// ----------------------------------------------------------------

export interface ProductCrawlResult {
  sourceId: string;
  sourceName: string;
  productsFound: number;
  productsCreated: number;
  productsUpdated: number;
  errors: string[];
  duration: number;
}
