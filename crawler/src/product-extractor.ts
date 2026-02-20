import Anthropic from '@anthropic-ai/sdk';
import pino from 'pino';
import { ExtractedProduct, ExtractedProductSchema, ProductCrawlSource } from './product-types';
import { config } from './config';

const logger = pino({ name: 'product-extractor' });

const client = new Anthropic({ apiKey: config.anthropic.apiKey });

// ----------------------------------------------------------------
// System prompt — tango product specialisation
// ----------------------------------------------------------------

const SYSTEM_PROMPT = `You are a specialized data extraction AI for Argentine Tango products sold on online shopping platforms.

Your task is to extract structured product deal information from raw text content of tango product search result pages.

TANGO PRODUCT CATEGORIES:
- shoes: Tango dance shoes (stilettos, practice shoes, men's dress shoes, bandoneon-sole shoes)
- clothing: Tango dance wear (dresses, skirts, trousers, tops, suits, milonga outfits)
- accessories: Tango accessories (shoe bags, dancing socks, insoles, ties, fans, embellishments)
- music: Tango music (CDs, vinyl records, digital downloads, instructional DVDs/Blu-rays)
- other: Any tango-related item that does not fit the above (books, videos, decorations)

CLASSIFICATION RULES:
- If the product is clearly a dance shoe or has "tango" + "shoes/zapatos/schuhe/scarpe" → "shoes"
- If it is a garment or dance wear → "clothing"
- If it is a small add-on for shoes or dancing → "accessories"
- If it is audio/video media about tango → "music"
- Otherwise → "other"

PRICE EXTRACTION RULES:
1. Extract BOTH the original (list/crossed-out) price and the current deal price.
2. If only one price is shown, set both original_price and deal_price to that value (no discount).
3. Remove currency symbols — return numeric values only (e.g., 29.99 not "$29.99").
4. Infer currency from the site locale/currency symbol: $ → USD, ₩ → KRW, ¥ → CNY, € → EUR, £ → GBP.
5. If the price appears to be in Korean Won, the numbers will be large (e.g., 59000); do not divide.

DEAL DETECTION:
- A deal exists when deal_price < original_price.
- Only extract products where there is some indication of tango relevance (title or description mentions tango, dance, milonga, vals, etc.).

EXTRACTION RULES:
1. Extract ALL tango-relevant products visible on the page.
2. Set source_url to the canonical product detail page URL (href of the product link).
   If no absolute URL is available, construct one from the base URL provided.
3. Preserve the product title in its original language.
4. Set confidence: 1.0 = clear tango product, clear prices; 0.7 = likely tango; 0.5 = uncertain.
5. expires_at: If a sale end date is shown, include it as ISO 8601. Otherwise null.
6. image_urls: Include all product image URLs found (absolute URLs only).

IMPORTANT:
- Return ONLY a valid JSON array, no markdown formatting, no extra text.
- If no relevant products are found, return [].
- Never fabricate prices, URLs, or product details.
- affiliate_url and affiliate_id fields should be omitted — they are generated separately.`;

// ----------------------------------------------------------------
// Public extraction function
// ----------------------------------------------------------------

/**
 * Uses Claude API to extract tango product deals from scraped page text.
 * Returns validated ExtractedProduct objects without affiliate URLs
 * (those are appended by buildAffiliateUrl after extraction).
 */
export async function extractProducts(
  pageContent: string,
  source: ProductCrawlSource,
): Promise<ExtractedProduct[]> {
  logger.info(
    { sourceId: source.id, url: source.base_url, contentLength: pageContent.length },
    'Extracting products with Claude API',
  );

  const userPrompt = buildUserPrompt(pageContent, source);

  try {
    const response = await client.messages.create({
      model: config.anthropic.model,
      max_tokens: config.anthropic.maxTokens,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      logger.warn({ sourceId: source.id }, 'No text content in Claude response');
      return [];
    }

    const rawJson = textBlock.text.trim();
    const products = parseAndValidateProducts(rawJson, source.id);

    // Attach affiliate URLs to each validated product
    return products.map((p) => ({
      ...p,
      affiliate_url: buildAffiliateUrl(p.source_url, source.affiliate_provider),
      affiliate_id: getAffiliateId(source.affiliate_provider),
    }));
  } catch (error) {
    logger.error({ error, sourceId: source.id }, 'Claude API product extraction failed');
    throw error;
  }
}

// ----------------------------------------------------------------
// Affiliate URL builders
// ----------------------------------------------------------------

/**
 * Wraps a canonical product URL with the appropriate affiliate tracking parameters.
 */
export function buildAffiliateUrl(
  sourceUrl: string,
  provider: 'amazon' | 'coupang' | 'aliexpress',
): string {
  try {
    switch (provider) {
      case 'amazon':
        return buildAmazonAffiliateUrl(sourceUrl);
      case 'coupang':
        return buildCoupangAffiliateUrl(sourceUrl);
      case 'aliexpress':
        return buildAliexpressAffiliateUrl(sourceUrl);
      default: {
        // Exhaustiveness guard — TypeScript should prevent reaching here
        const _exhaustive: never = provider;
        return sourceUrl;
      }
    }
  } catch (error) {
    // Malformed URLs should not crash the crawler; fall back to the source URL
    logger.warn({ error, sourceUrl, provider }, 'Failed to build affiliate URL, using source URL');
    return sourceUrl;
  }
}

function buildAmazonAffiliateUrl(sourceUrl: string): string {
  const url = new URL(sourceUrl);
  url.searchParams.set('tag', config.affiliate.amazon.associateTag);
  // Remove any existing Amazon session / referral params that might override the tag
  url.searchParams.delete('ref');
  url.searchParams.delete('linkCode');
  return url.toString();
}

function buildCoupangAffiliateUrl(sourceUrl: string): string {
  const { partnerId, subId } = config.affiliate.coupang;

  // Coupang Partners uses a redirect URL scheme:
  // https://partners.coupang.com/products/redirect?productId=...&subId=...&partnersApiId=...
  // When we only have the product page URL (not a direct deep link), we encode the target.
  const redirectBase = 'https://partners.coupang.com/products/redirect';
  const params = new URLSearchParams({
    url: sourceUrl,
    ...(partnerId && { partnersApiId: partnerId }),
    ...(subId && { subId }),
  });
  return `${redirectBase}?${params.toString()}`;
}

function buildAliexpressAffiliateUrl(sourceUrl: string): string {
  const { trackingId } = config.affiliate.aliexpress;

  // AliExpress Portals / aff.tps affiliate click URL:
  // https://s.click.aliexpress.com/e/_<code> — but for deep-links we use the
  // affilate deeplink generator endpoint when we have the product URL.
  const redirectBase = 'https://s.click.aliexpress.com/deep_link.htm';
  const params = new URLSearchParams({
    dl_target_url: sourceUrl,
    ...(trackingId && { aff_fcid: trackingId }),
    aff_fsk: 'tango',
  });
  return `${redirectBase}?${params.toString()}`;
}

/**
 * Returns the configured affiliate partner identifier for a given provider.
 * This is stored in the affiliate_id column for reporting purposes.
 */
function getAffiliateId(provider: 'amazon' | 'coupang' | 'aliexpress'): string {
  switch (provider) {
    case 'amazon':
      return config.affiliate.amazon.associateTag;
    case 'coupang':
      return config.affiliate.coupang.partnerId || config.affiliate.coupang.subId;
    case 'aliexpress':
      return config.affiliate.aliexpress.trackingId;
    default: {
      const _exhaustive: never = provider;
      return '';
    }
  }
}

// ----------------------------------------------------------------
// Prompt construction
// ----------------------------------------------------------------

function buildUserPrompt(content: string, source: ProductCrawlSource): string {
  return `Extract all tango-related product deals from the following shopping page content.

Source URL: ${source.base_url}
Affiliate Provider: ${source.affiliate_provider}
Target Product Category: ${source.product_category}
${source.parser_config.language ? `Page Language: ${source.parser_config.language}` : ''}

---PAGE CONTENT START---
${content}
---PAGE CONTENT END---

Return a JSON array of extracted products. Each product must have at minimum:
title, product_category, original_price, deal_price, currency, affiliate_provider, source_url.`;
}

// ----------------------------------------------------------------
// Parse + Zod validation
// ----------------------------------------------------------------

function parseAndValidateProducts(rawJson: string, sourceId: string): ExtractedProduct[] {
  // Strip optional markdown code fences that some Claude responses include
  let jsonStr = rawJson;
  const jsonMatch = rawJson.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    logger.error(
      { rawJson: rawJson.substring(0, 500), sourceId },
      'Failed to parse product JSON from Claude',
    );
    return [];
  }

  if (!Array.isArray(parsed)) {
    logger.warn({ sourceId }, 'Claude product response is not an array');
    return [];
  }

  const validProducts: ExtractedProduct[] = [];

  for (const item of parsed) {
    const result = ExtractedProductSchema.safeParse(item);
    if (result.success) {
      validProducts.push(result.data);
    } else {
      logger.warn(
        { errors: result.error.issues, title: (item as Record<string, unknown>).title, sourceId },
        'Product validation failed, skipping',
      );
    }
  }

  logger.info(
    { sourceId, total: parsed.length, valid: validProducts.length },
    'Product extraction complete',
  );

  return validProducts;
}
