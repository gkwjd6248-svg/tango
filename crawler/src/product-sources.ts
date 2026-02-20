import { ProductCrawlSource } from './product-types';

/**
 * Predefined product crawl sources for tango shopping sites.
 *
 * Scraper choice rationale:
 * - Amazon / AliExpress search results: heavy JavaScript rendering → playwright
 * - Coupang search results: also JavaScript-rendered → playwright
 *
 * maxPages is intentionally conservative (2-3 pages) to avoid rate-limiting
 * and keep Claude API token costs manageable per run.
 *
 * waitForSelector targets the first product card on each platform so Playwright
 * waits until the search results have actually loaded before capturing HTML.
 */

export const PRODUCT_SOURCES: ProductCrawlSource[] = [
  // ------------------------------------------------------------------
  // Amazon US — tango shoes
  // ------------------------------------------------------------------
  {
    id: 'amazon-us-tango-shoes',
    name: 'Amazon US — Tango Shoes',
    base_url: 'https://www.amazon.com/s?k=tango+dance+shoes&rh=n%3A679255011',
    affiliate_provider: 'amazon',
    product_category: 'shoes',
    crawl_frequency: 'daily',
    is_active: true,
    parser_config: {
      scraper: 'playwright',
      language: 'en',
      waitForSelector: '[data-component-type="s-search-result"]',
      selectors: {
        productList: '[data-component-type="s-search-result"]',
        title: 'h2 a span',
        price: '.a-price-whole',
        originalPrice: '.a-text-price .a-offscreen',
        image: '.s-image',
        link: 'h2 a',
      },
      pagination: {
        type: 'url_param',
        param: 'page',
        maxPages: 2,
      },
    },
  },

  // ------------------------------------------------------------------
  // Amazon US — tango clothing
  // ------------------------------------------------------------------
  {
    id: 'amazon-us-tango-clothing',
    name: 'Amazon US — Tango Clothing',
    base_url: 'https://www.amazon.com/s?k=tango+dance+dress+outfit',
    affiliate_provider: 'amazon',
    product_category: 'clothing',
    crawl_frequency: 'daily',
    is_active: true,
    parser_config: {
      scraper: 'playwright',
      language: 'en',
      waitForSelector: '[data-component-type="s-search-result"]',
      selectors: {
        productList: '[data-component-type="s-search-result"]',
        title: 'h2 a span',
        price: '.a-price-whole',
        originalPrice: '.a-text-price .a-offscreen',
        image: '.s-image',
        link: 'h2 a',
      },
      pagination: {
        type: 'url_param',
        param: 'page',
        maxPages: 2,
      },
    },
  },

  // ------------------------------------------------------------------
  // Amazon US — tango accessories
  // ------------------------------------------------------------------
  {
    id: 'amazon-us-tango-accessories',
    name: 'Amazon US — Tango Accessories',
    base_url: 'https://www.amazon.com/s?k=tango+dance+accessories',
    affiliate_provider: 'amazon',
    product_category: 'accessories',
    crawl_frequency: 'weekly',
    is_active: true,
    parser_config: {
      scraper: 'playwright',
      language: 'en',
      waitForSelector: '[data-component-type="s-search-result"]',
      selectors: {
        productList: '[data-component-type="s-search-result"]',
        title: 'h2 a span',
        price: '.a-price-whole',
        originalPrice: '.a-text-price .a-offscreen',
        image: '.s-image',
        link: 'h2 a',
      },
      pagination: {
        type: 'url_param',
        param: 'page',
        maxPages: 2,
      },
    },
  },

  // ------------------------------------------------------------------
  // Amazon US — tango music (CDs / vinyl)
  // ------------------------------------------------------------------
  {
    id: 'amazon-us-tango-music',
    name: 'Amazon US — Tango Music',
    // rh filter: Music (301668) + Tango (genre sub-node)
    base_url: 'https://www.amazon.com/s?k=tango+music+cd&rh=n%3A5174',
    affiliate_provider: 'amazon',
    product_category: 'music',
    crawl_frequency: 'weekly',
    is_active: true,
    parser_config: {
      scraper: 'playwright',
      language: 'en',
      waitForSelector: '[data-component-type="s-search-result"]',
      selectors: {
        productList: '[data-component-type="s-search-result"]',
        title: 'h2 a span',
        price: '.a-price-whole',
        originalPrice: '.a-text-price .a-offscreen',
        image: '.s-image',
        link: 'h2 a',
      },
      pagination: {
        type: 'url_param',
        param: 'page',
        maxPages: 2,
      },
    },
  },

  // ------------------------------------------------------------------
  // Coupang KR — tango shoes (탱고 신발)
  // ------------------------------------------------------------------
  {
    id: 'coupang-kr-tango-shoes',
    name: 'Coupang KR — 탱고 신발',
    base_url: 'https://www.coupang.com/np/search?q=%ED%83%B1%EA%B3%A0+%EC%8B%A0%EB%B0%9C&channel=user',
    affiliate_provider: 'coupang',
    product_category: 'shoes',
    crawl_frequency: 'daily',
    is_active: true,
    parser_config: {
      scraper: 'playwright',
      language: 'ko',
      waitForSelector: '.search-product',
      selectors: {
        productList: '.search-product',
        title: '.name',
        price: '.price-value',
        originalPrice: '.base-price',
        image: 'img.thumbnail',
        link: 'a.search-product-wrap',
      },
      pagination: {
        type: 'url_param',
        param: 'page',
        maxPages: 2,
      },
    },
  },

  // ------------------------------------------------------------------
  // Coupang KR — tango clothing (탱고 의류)
  // ------------------------------------------------------------------
  {
    id: 'coupang-kr-tango-clothing',
    name: 'Coupang KR — 탱고 의류',
    base_url: 'https://www.coupang.com/np/search?q=%ED%83%B1%EA%B3%A0+%EC%9D%98%EB%A5%98&channel=user',
    affiliate_provider: 'coupang',
    product_category: 'clothing',
    crawl_frequency: 'daily',
    is_active: true,
    parser_config: {
      scraper: 'playwright',
      language: 'ko',
      waitForSelector: '.search-product',
      selectors: {
        productList: '.search-product',
        title: '.name',
        price: '.price-value',
        originalPrice: '.base-price',
        image: 'img.thumbnail',
        link: 'a.search-product-wrap',
      },
      pagination: {
        type: 'url_param',
        param: 'page',
        maxPages: 2,
      },
    },
  },

  // ------------------------------------------------------------------
  // AliExpress — tango dance shoes
  // ------------------------------------------------------------------
  {
    id: 'aliexpress-tango-shoes',
    name: 'AliExpress — Tango Dance Shoes',
    base_url: 'https://www.aliexpress.com/w/wholesale-tango-dance-shoes.html',
    affiliate_provider: 'aliexpress',
    product_category: 'shoes',
    crawl_frequency: 'daily',
    is_active: true,
    parser_config: {
      scraper: 'playwright',
      language: 'en',
      waitForSelector: '.search-item-card-wrapper-gallery',
      selectors: {
        productList: '.search-item-card-wrapper-gallery',
        title: 'h1.item-title, .item-title',
        price: '.price-sale',
        originalPrice: '.price-origin',
        image: 'img.product-img',
        link: 'a.search-card-item',
      },
      pagination: {
        type: 'url_param',
        param: 'page',
        maxPages: 2,
      },
    },
  },

  // ------------------------------------------------------------------
  // AliExpress — tango outfit / clothing
  // ------------------------------------------------------------------
  {
    id: 'aliexpress-tango-outfit',
    name: 'AliExpress — Tango Outfit',
    base_url: 'https://www.aliexpress.com/w/wholesale-tango-outfit.html',
    affiliate_provider: 'aliexpress',
    product_category: 'clothing',
    crawl_frequency: 'weekly',
    is_active: true,
    parser_config: {
      scraper: 'playwright',
      language: 'en',
      waitForSelector: '.search-item-card-wrapper-gallery',
      selectors: {
        productList: '.search-item-card-wrapper-gallery',
        title: 'h1.item-title, .item-title',
        price: '.price-sale',
        originalPrice: '.price-origin',
        image: 'img.product-img',
        link: 'a.search-card-item',
      },
      pagination: {
        type: 'url_param',
        param: 'page',
        maxPages: 2,
      },
    },
  },

  // ------------------------------------------------------------------
  // AliExpress — tango accessories (insoles, bags, socks)
  // ------------------------------------------------------------------
  {
    id: 'aliexpress-tango-accessories',
    name: 'AliExpress — Tango Accessories',
    base_url: 'https://www.aliexpress.com/w/wholesale-tango-dance-accessories.html',
    affiliate_provider: 'aliexpress',
    product_category: 'accessories',
    crawl_frequency: 'weekly',
    is_active: true,
    parser_config: {
      scraper: 'playwright',
      language: 'en',
      waitForSelector: '.search-item-card-wrapper-gallery',
      selectors: {
        productList: '.search-item-card-wrapper-gallery',
        title: 'h1.item-title, .item-title',
        price: '.price-sale',
        originalPrice: '.price-origin',
        image: 'img.product-img',
        link: 'a.search-card-item',
      },
      pagination: {
        type: 'url_param',
        param: 'page',
        maxPages: 2,
      },
    },
  },
];

/**
 * Returns only the sources that are currently active.
 */
export function getActiveProductSources(): ProductCrawlSource[] {
  return PRODUCT_SOURCES.filter((s) => s.is_active);
}
