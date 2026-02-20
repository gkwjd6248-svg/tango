import pino from 'pino';
import { scrapeSource, closeBrowser } from './scraper';
import { extractProducts } from './product-extractor';
import { upsertProductDeal, deactivateExpiredDeals, getActiveDealsCount, closeProductPool } from './product-storage';
import { getActiveProductSources } from './product-sources';
import { ProductCrawlResult, ProductCrawlSource } from './product-types';
import { config } from './config';

const logger = pino({ name: 'product-crawler' });

// Minimum extraction confidence required to persist a product deal.
// Matches the event crawler's minConfidence threshold so the bar is consistent.
const MIN_CONFIDENCE = config.crawler.minConfidence;

// ----------------------------------------------------------------
// Single-source crawl
// ----------------------------------------------------------------

/**
 * Crawls one product source: scrapes → extracts → upserts.
 * Returns a result summary without throwing; errors are captured in result.errors.
 */
async function crawlProductSource(source: ProductCrawlSource): Promise<ProductCrawlResult> {
  const startTime = Date.now();
  const result: ProductCrawlResult = {
    sourceId: source.id,
    sourceName: source.name,
    productsFound: 0,
    productsCreated: 0,
    productsUpdated: 0,
    errors: [],
    duration: 0,
  };

  logger.info(
    { sourceId: source.id, name: source.name, url: source.base_url },
    'Starting product source crawl',
  );

  try {
    // Step 1: Scrape HTML pages using the existing dual-mode scraper.
    // scrapeSource() expects a CrawlSource shape; ProductCrawlSource is structurally
    // compatible for the fields that scrapeSource actually reads (base_url, parser_config).
    // scrapeSource only reads base_url and parser_config — safe to cast
    const htmlPages = await scrapeSource(source as unknown as Parameters<typeof scrapeSource>[0]);
    logger.info({ sourceId: source.id, pageCount: htmlPages.length }, 'Scraping complete');

    // Step 2: Send each page to Claude for product extraction.
    for (const pageContent of htmlPages) {
      let products;
      try {
        products = await extractProducts(pageContent, source);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        result.errors.push(`Extraction failed: ${msg}`);
        logger.error({ error: err, sourceId: source.id }, 'Product extraction failed for page');
        continue; // move to the next page rather than aborting the source
      }

      result.productsFound += products.length;

      // Step 3: Persist each validated, high-confidence product.
      for (const product of products) {
        if (product.confidence < MIN_CONFIDENCE) {
          logger.warn(
            { title: product.title, confidence: product.confidence, sourceId: source.id },
            'Low confidence product, skipping',
          );
          continue;
        }

        try {
          const action = await upsertProductDeal(product);
          if (action === 'created') result.productsCreated++;
          if (action === 'updated') result.productsUpdated++;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          result.errors.push(`Upsert failed for "${product.title}": ${msg}`);
          logger.error({ error: err, title: product.title }, 'Product deal upsert failed');
        }
      }
    }
  } catch (err) {
    // Outer catch handles scraping failures (network, Playwright errors, etc.)
    const msg = err instanceof Error ? err.message : String(err);
    result.errors.push(msg);
    logger.error({ error: err, sourceId: source.id }, 'Product source crawl failed');
  }

  result.duration = Date.now() - startTime;

  logger.info(
    {
      sourceId: source.id,
      found: result.productsFound,
      created: result.productsCreated,
      updated: result.productsUpdated,
      errors: result.errors.length,
      durationMs: result.duration,
    },
    'Product source crawl complete',
  );

  return result;
}

// ----------------------------------------------------------------
// Full cycle orchestrator
// ----------------------------------------------------------------

/**
 * Main entry point for the product deals crawler.
 *
 * 1. Loads all active product sources.
 * 2. Crawls each source sequentially (polite crawling; avoids hammering the same domain).
 * 3. Deactivates any deals whose expires_at has passed.
 * 4. Logs an aggregate summary.
 */
export async function crawlProductDeals(): Promise<ProductCrawlResult[]> {
  logger.info('=== Starting product deals crawl cycle ===');
  const cycleStart = Date.now();

  const sources = getActiveProductSources();
  logger.info({ sourceCount: sources.length }, 'Active product sources loaded');

  if (sources.length === 0) {
    logger.warn('No active product crawl sources found');
    return [];
  }

  const results: ProductCrawlResult[] = [];

  for (const source of sources) {
    const result = await crawlProductSource(source);
    results.push(result);

    // Polite inter-source delay — reuse the same requestDelayMs as the event crawler.
    // This is especially important when multiple sources belong to the same domain
    // (e.g., amazon-us-tango-shoes and amazon-us-tango-clothing both hit amazon.com).
    if (sources.indexOf(source) < sources.length - 1) {
      await delay(config.crawler.requestDelayMs);
    }
  }

  // Step 4: Housekeeping — mark expired deals inactive.
  try {
    const deactivated = await deactivateExpiredDeals();
    logger.info({ deactivated }, 'Expired deals deactivation complete');
  } catch (err) {
    logger.error({ error: err }, 'Failed to deactivate expired deals');
  }

  // Final aggregate summary
  const totalFound = results.reduce((sum, r) => sum + r.productsFound, 0);
  const totalCreated = results.reduce((sum, r) => sum + r.productsCreated, 0);
  const totalUpdated = results.reduce((sum, r) => sum + r.productsUpdated, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

  try {
    const activeCount = await getActiveDealsCount();
    logger.info({ activeDealsInDb: activeCount }, 'Active deals count');
  } catch {
    // Non-critical; just a status metric
  }

  logger.info(
    {
      sources: sources.length,
      totalFound,
      totalCreated,
      totalUpdated,
      totalErrors,
      totalDurationMs: Date.now() - cycleStart,
    },
    '=== Product deals crawl cycle complete ===',
  );

  return results;
}

// ----------------------------------------------------------------
// Standalone execution
// ----------------------------------------------------------------

async function main(): Promise<void> {
  try {
    await crawlProductDeals();
  } catch (error) {
    logger.fatal({ error }, 'Fatal error in product crawler');
    process.exit(1);
  } finally {
    await closeBrowser();
    await closeProductPool();
  }
}

// Allow both direct execution and import as a module.
// When imported by a scheduler (e.g., cron wrapper in index.ts), main() is not called.
if (require.main === module) {
  main();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
