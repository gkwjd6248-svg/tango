import { z } from 'zod';

// Claude API에서 추출된 이벤트 스키마
export const ExtractedEventSchema = z.object({
  title: z.string().min(1),
  title_original: z.string().optional(),
  description: z.string().optional(),
  event_type: z.enum(['milonga', 'festival', 'workshop', 'class', 'practica']),
  venue_name: z.string().optional(),
  address: z.string().optional(),
  city: z.string().min(1),
  country_code: z.string().length(2),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  start_datetime: z.string(),
  end_datetime: z.string().nullable().optional(),
  recurrence_rule: z.string().nullable().optional(),
  organizer_name: z.string().nullable().optional(),
  price_info: z.string().nullable().optional(),
  currency: z.string().length(3).nullable().optional(),
  image_urls: z.array(z.string()).optional().default([]),
  confidence: z.number().min(0).max(1).default(0.5),
});

export type ExtractedEvent = z.infer<typeof ExtractedEventSchema>;

// 크롤링 소스 설정
export interface CrawlSource {
  id: string;
  name: string;
  base_url: string;
  crawl_frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  last_crawled_at: Date | null;
  is_active: boolean;
  parser_config: ParserConfig;
}

export interface ParserConfig {
  scraper: 'playwright' | 'cheerio';
  selectors?: {
    eventList?: string;
    title?: string;
    date?: string;
    content?: string;
  };
  pagination?: {
    type: 'url_param' | 'infinite_scroll' | 'next_button';
    param?: string;
    maxPages?: number;
  };
  language?: string;
  waitForSelector?: string;
}

// 크롤링 결과
export interface CrawlResult {
  sourceId: string;
  sourceName: string;
  eventsFound: number;
  eventsCreated: number;
  eventsUpdated: number;
  errors: string[];
  duration: number;
}

// 크롤링 로그
export interface CrawlLog {
  id?: string;
  crawl_source_id: string;
  started_at: Date;
  completed_at?: Date;
  status: 'running' | 'completed' | 'failed' | 'partial';
  events_found: number;
  events_created: number;
  events_updated: number;
  error_log?: string;
}
