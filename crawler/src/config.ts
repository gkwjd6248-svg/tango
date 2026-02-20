import 'dotenv/config';

export const config = {
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5433', 10),
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'tango_community',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001',
    maxTokens: 4096,
  },

  crawler: {
    requestDelayMs: parseInt(process.env.CRAWL_DELAY_MS || '2000', 10),
    maxRetries: 3,
    timeoutMs: 30000,
    userAgent: 'TangoCommunityBot/1.0 (+https://tangocommunity.app/bot)',
    minConfidence: 0.5,
  },

  geocoding: {
    apiKey: process.env.GOOGLE_GEOCODING_API_KEY || '',
  },

  affiliate: {
    amazon: {
      associateTag: process.env.AMAZON_ASSOCIATE_TAG || 'tango-community-20',
      marketplace: process.env.AMAZON_MARKETPLACE || 'US',
    },
    coupang: {
      partnerId: process.env.COUPANG_PARTNER_ID || '',
      subId: process.env.COUPANG_SUB_ID || 'tango',
    },
    aliexpress: {
      trackingId: process.env.ALIEXPRESS_TRACKING_ID || '',
    },
  },
} as const;
