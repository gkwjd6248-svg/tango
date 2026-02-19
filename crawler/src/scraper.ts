import * as cheerio from 'cheerio';
import { chromium, Browser, Page } from 'playwright';
import pino from 'pino';
import { CrawlSource } from './types';
import { config } from './config';

const logger = pino({ name: 'scraper' });

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await chromium.launch({ headless: true });
  }
  return browser;
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

/**
 * 웹 페이지에서 HTML 콘텐츠를 스크래핑합니다.
 * 소스 설정에 따라 Playwright(동적) 또는 Cheerio(정적)를 선택합니다.
 */
export async function scrapeSource(source: CrawlSource): Promise<string[]> {
  const { parser_config: parserConfig } = source;
  const pages: string[] = [];

  try {
    if (parserConfig.scraper === 'playwright') {
      const htmlPages = await scrapeWithPlaywright(source);
      pages.push(...htmlPages);
    } else {
      const htmlPages = await scrapeWithCheerio(source);
      pages.push(...htmlPages);
    }
  } catch (error) {
    logger.error({ error, sourceId: source.id, url: source.base_url }, 'Scraping failed');
    throw error;
  }

  return pages;
}

/**
 * Playwright로 JavaScript가 필요한 동적 페이지를 스크래핑합니다.
 */
async function scrapeWithPlaywright(source: CrawlSource): Promise<string[]> {
  const b = await getBrowser();
  const pages: string[] = [];
  const maxPages = source.parser_config.pagination?.maxPages || 1;

  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
    const url = buildPageUrl(source.base_url, source.parser_config, pageNum);
    logger.info({ url, pageNum }, 'Scraping with Playwright');

    const page: Page = await b.newPage({
      userAgent: config.crawler.userAgent,
    });

    try {
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: config.crawler.timeoutMs,
      });

      if (source.parser_config.waitForSelector) {
        await page.waitForSelector(source.parser_config.waitForSelector, {
          timeout: 10000,
        }).catch(() => {
          logger.warn({ url }, 'Wait for selector timed out, proceeding anyway');
        });
      }

      const html = await page.content();
      const cleaned = cleanHtml(html);
      pages.push(cleaned);

      // Polite crawling: 페이지 간 딜레이
      if (pageNum < maxPages) {
        await delay(config.crawler.requestDelayMs);
      }
    } finally {
      await page.close();
    }
  }

  return pages;
}

/**
 * Cheerio로 정적 HTML 페이지를 스크래핑합니다.
 */
async function scrapeWithCheerio(source: CrawlSource): Promise<string[]> {
  const pages: string[] = [];
  const maxPages = source.parser_config.pagination?.maxPages || 1;

  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
    const url = buildPageUrl(source.base_url, source.parser_config, pageNum);
    logger.info({ url, pageNum }, 'Scraping with Cheerio');

    const response = await fetch(url, {
      headers: {
        'User-Agent': config.crawler.userAgent,
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9,es;q=0.8,ko;q=0.7',
      },
      signal: AbortSignal.timeout(config.crawler.timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const cleaned = cleanHtml(html);
    pages.push(cleaned);

    if (pageNum < maxPages) {
      await delay(config.crawler.requestDelayMs);
    }
  }

  return pages;
}

/**
 * HTML을 정제하여 Claude API에 보낼 수 있도록 준비합니다.
 * 불필요한 태그, 스크립트, 스타일, 네비게이션 등을 제거합니다.
 */
function cleanHtml(html: string): string {
  const $ = cheerio.load(html);

  // 불필요한 요소 제거
  $('script, style, noscript, iframe, svg, link, meta').remove();
  $('nav, footer, header, .cookie-banner, .ad, .advertisement, .sidebar').remove();
  $('[class*="cookie"], [class*="popup"], [class*="modal"], [id*="cookie"]').remove();

  // 메인 콘텐츠 추출 시도
  let content = '';
  const mainSelectors = ['main', 'article', '[role="main"]', '.content', '#content', '.main-content'];

  for (const selector of mainSelectors) {
    const mainEl = $(selector);
    if (mainEl.length > 0) {
      content = mainEl.text();
      break;
    }
  }

  // 메인 콘텐츠를 못 찾으면 body 전체
  if (!content) {
    content = $('body').text();
  }

  // 연속 공백/줄바꿈 정리
  content = content
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();

  // 토큰 제한: 대략 100k 문자로 제한 (약 25k 토큰)
  if (content.length > 100000) {
    content = content.substring(0, 100000);
  }

  return content;
}

function buildPageUrl(baseUrl: string, parserConfig: CrawlSource['parser_config'], pageNum: number): string {
  if (pageNum === 1 || !parserConfig.pagination) {
    return baseUrl;
  }

  const { pagination } = parserConfig;
  if (pagination.type === 'url_param' && pagination.param) {
    const url = new URL(baseUrl);
    url.searchParams.set(pagination.param, String(pageNum));
    return url.toString();
  }

  return baseUrl;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
