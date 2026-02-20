import pino from 'pino';
import { scrapeSource, closeBrowser } from './scraper';
import { extractEvents } from './ai-extractor';
import {
  getActiveSources,
  createCrawlLog,
  updateCrawlLog,
  upsertEvent,
  updateSourceLastCrawled,
  closePool,
} from './storage';
import { CrawlResult } from './types';
import { config } from './config';

const logger = pino({ name: 'crawler-main' });

/**
 * 단일 소스를 크롤링합니다.
 */
export async function crawlSource(source: {
  id: string;
  name: string;
  base_url: string;
  parser_config: { language?: string };
}): Promise<CrawlResult> {
  const startTime = Date.now();
  const result: CrawlResult = {
    sourceId: source.id,
    sourceName: source.name,
    eventsFound: 0,
    eventsCreated: 0,
    eventsUpdated: 0,
    errors: [],
    duration: 0,
  };

  const logId = await createCrawlLog(source.id);

  try {
    logger.info({ sourceId: source.id, name: source.name, url: source.base_url }, 'Starting crawl');

    // Step 1: 웹 스크래핑
    const htmlPages = await scrapeSource(source as any);
    logger.info({ pageCount: htmlPages.length }, 'Scraping complete');

    // Step 2-3: 각 페이지에서 이벤트 추출
    for (const pageContent of htmlPages) {
      try {
        const events = await extractEvents(
          pageContent,
          source.base_url,
          source.parser_config.language,
        );
        result.eventsFound += events.length;

        // Step 4: 검증된 이벤트를 DB에 저장
        for (const event of events) {
          // 신뢰도가 낮은 이벤트는 건너뜀
          if (event.confidence < config.crawler.minConfidence) {
            logger.warn(
              { title: event.title, confidence: event.confidence },
              'Low confidence event, skipping',
            );
            continue;
          }

          try {
            const action = await upsertEvent(event, source.base_url, source.id);
            if (action === 'created') result.eventsCreated++;
            if (action === 'updated') result.eventsUpdated++;
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            result.errors.push(`Upsert failed for "${event.title}": ${msg}`);
            logger.error({ error: err, event: event.title }, 'Event upsert failed');
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        result.errors.push(`Extraction failed: ${msg}`);
        logger.error({ error: err }, 'Event extraction failed for page');
      }
    }

    // 크롤링 완료
    await updateSourceLastCrawled(source.id);
    await updateCrawlLog(logId, {
      status: result.errors.length > 0 ? 'partial' : 'completed',
      completed_at: new Date(),
      events_found: result.eventsFound,
      events_created: result.eventsCreated,
      events_updated: result.eventsUpdated,
      error_log: result.errors.length > 0 ? result.errors.join('\n') : undefined,
    });

    result.duration = Date.now() - startTime;
    logger.info(
      {
        sourceId: source.id,
        found: result.eventsFound,
        created: result.eventsCreated,
        updated: result.eventsUpdated,
        errors: result.errors.length,
        durationMs: result.duration,
      },
      'Crawl complete',
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.errors.push(msg);
    result.duration = Date.now() - startTime;

    await updateCrawlLog(logId, {
      status: 'failed',
      completed_at: new Date(),
      error_log: msg,
    });

    logger.error({ error: err, sourceId: source.id }, 'Crawl failed');
  }

  return result;
}

/**
 * 모든 활성 소스를 순차적으로 크롤링합니다.
 */
export async function crawlAll(): Promise<void> {
  logger.info('=== Starting full crawl cycle ===');
  const startTime = Date.now();

  const sources = await getActiveSources();
  logger.info({ sourceCount: sources.length }, 'Active sources loaded');

  if (sources.length === 0) {
    logger.warn('No active crawl sources found');
    return;
  }

  const results: CrawlResult[] = [];

  for (const source of sources) {
    const result = await crawlSource(source);
    results.push(result);
  }

  // 요약 출력
  const totalFound = results.reduce((sum, r) => sum + r.eventsFound, 0);
  const totalCreated = results.reduce((sum, r) => sum + r.eventsCreated, 0);
  const totalUpdated = results.reduce((sum, r) => sum + r.eventsUpdated, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

  logger.info(
    {
      sources: sources.length,
      totalFound,
      totalCreated,
      totalUpdated,
      totalErrors,
      totalDurationMs: Date.now() - startTime,
    },
    '=== Full crawl cycle complete ===',
  );
}

// 메인 실행
async function main(): Promise<void> {
  try {
    await crawlAll();
  } catch (error) {
    logger.fatal({ error }, 'Fatal error in crawler');
    process.exit(1);
  } finally {
    await closeBrowser();
    await closePool();
  }
}

// Guard so main() only runs when executed directly, not when imported
if (require.main === module) {
  main();
}
