/**
 * local-runner.ts
 *
 * Unified local orchestrator for all crawling tasks.
 *
 * Usage:
 *   tsx src/local-runner.ts                 # start scheduler (runs forever)
 *   tsx src/local-runner.ts --once          # run one full cycle and exit
 *   tsx src/local-runner.ts --events-only   # run only event crawling
 *   tsx src/local-runner.ts --products-only # run only product deals crawling
 *   tsx src/local-runner.ts --hotels-only   # run only hotel enrichment
 */

import pino from 'pino';
import { crawlAll } from './index';
import { crawlProductDeals } from './product-crawler';
import { enrichAllEvents, closeEnricherBrowser } from './hotel-enricher';
import { closeHotelPool } from './hotel-storage';
import { closePool } from './storage';
import { closeBrowser } from './scraper';

const logger = pino({ name: 'local-runner' });

// ─── Schedule configuration (milliseconds) ───────────────────────────────────
const SCHEDULE = {
  eventsIntervalMs:   6  * 60 * 60 * 1000, // every 6 hours
  productsIntervalMs: 12 * 60 * 60 * 1000, // every 12 hours
  hotelsIntervalMs:   24 * 60 * 60 * 1000, // every 24 hours
} as const;

// ─── State tracking ───────────────────────────────────────────────────────────

interface TaskState {
  lastRunAt: Date | null;
  lastStatus: 'ok' | 'error' | 'running' | 'pending';
  lastDurationMs: number;
  runCount: number;
}

const state: Record<'events' | 'products' | 'hotels', TaskState> = {
  events:   { lastRunAt: null, lastStatus: 'pending', lastDurationMs: 0, runCount: 0 },
  products: { lastRunAt: null, lastStatus: 'pending', lastDurationMs: 0, runCount: 0 },
  hotels:   { lastRunAt: null, lastStatus: 'pending', lastDurationMs: 0, runCount: 0 },
};

// Timer handles — kept so we can clear them on SIGINT/SIGTERM
const timers: NodeJS.Timeout[] = [];
let isShuttingDown = false;

// ─── Dashboard helpers ────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  if (ms < 1_000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1_000).toFixed(1)}s`;
  return `${Math.floor(ms / 60_000)}m ${Math.floor((ms % 60_000) / 1_000)}s`;
}

function formatDate(d: Date | null): string {
  if (!d) return 'never';
  return d.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
}

function nextRunAt(lastRun: Date | null, intervalMs: number): string {
  if (!lastRun) return 'immediately';
  const next = new Date(lastRun.getTime() + intervalMs);
  const now = Date.now();
  if (next.getTime() <= now) return 'overdue';
  const diffMs = next.getTime() - now;
  return `in ${formatDuration(diffMs)} (${formatDate(next)})`;
}

function printDashboard(): void {
  const line = '─'.repeat(70);
  console.log(`\n${line}`);
  console.log('  Tango Community Crawler — Dashboard');
  console.log(`  ${new Date().toISOString()}`);
  console.log(line);

  const tasks: Array<{ label: string; key: 'events' | 'products' | 'hotels'; interval: number }> = [
    { label: 'Events',   key: 'events',   interval: SCHEDULE.eventsIntervalMs },
    { label: 'Products', key: 'products', interval: SCHEDULE.productsIntervalMs },
    { label: 'Hotels',   key: 'hotels',   interval: SCHEDULE.hotelsIntervalMs },
  ];

  for (const task of tasks) {
    const s = state[task.key];
    const status = s.lastStatus.padEnd(7);
    const lastRun = formatDate(s.lastRunAt);
    const next = nextRunAt(s.lastRunAt, task.interval);
    const duration = s.lastDurationMs > 0 ? formatDuration(s.lastDurationMs) : '-';
    console.log(`  ${task.label.padEnd(10)} status=${status} runs=${s.runCount}`);
    console.log(`             last=${lastRun}  took=${duration}`);
    console.log(`             next=${next}`);
  }

  console.log(line + '\n');
}

// ─── Task runners ─────────────────────────────────────────────────────────────

async function runEvents(): Promise<void> {
  if (isShuttingDown) return;
  state.events.lastStatus = 'running';
  const t0 = Date.now();
  logger.info('Starting event crawl');
  try {
    await crawlAll();
    state.events.lastStatus = 'ok';
  } catch (err) {
    state.events.lastStatus = 'error';
    logger.error({ err }, 'Event crawl failed');
  } finally {
    state.events.lastRunAt = new Date();
    state.events.lastDurationMs = Date.now() - t0;
    state.events.runCount++;
  }
}

async function runProducts(): Promise<void> {
  if (isShuttingDown) return;
  state.products.lastStatus = 'running';
  const t0 = Date.now();
  logger.info('Starting product deals crawl');
  try {
    await crawlProductDeals();
    state.products.lastStatus = 'ok';
  } catch (err) {
    state.products.lastStatus = 'error';
    logger.error({ err }, 'Product crawl failed');
  } finally {
    state.products.lastRunAt = new Date();
    state.products.lastDurationMs = Date.now() - t0;
    state.products.runCount++;
  }
}

async function runHotels(): Promise<void> {
  if (isShuttingDown) return;
  state.hotels.lastStatus = 'running';
  const t0 = Date.now();
  logger.info('Starting hotel enrichment');
  try {
    const summary = await enrichAllEvents();
    state.hotels.lastStatus = summary.eventsFailed === summary.eventsProcessed && summary.eventsProcessed > 0
      ? 'error'
      : 'ok';
    logger.info(summary, 'Hotel enrichment summary');
  } catch (err) {
    state.hotels.lastStatus = 'error';
    logger.error({ err }, 'Hotel enrichment failed');
  } finally {
    state.hotels.lastRunAt = new Date();
    state.hotels.lastDurationMs = Date.now() - t0;
    state.hotels.runCount++;
  }
}

// ─── Full cycle ───────────────────────────────────────────────────────────────

/**
 * Run all three tasks sequentially:
 * 1. Event crawling
 * 2. Product deals crawling
 * 3. Hotel enrichment (depends on freshly crawled events)
 */
export async function runFullCycle(): Promise<void> {
  const cycleStart = Date.now();
  logger.info('=== Starting full crawl cycle ===');

  await runEvents();
  await runProducts();
  await runHotels();

  printDashboard();

  logger.info(
    { totalDurationMs: Date.now() - cycleStart },
    '=== Full crawl cycle complete ===',
  );
}

// ─── Scheduler ────────────────────────────────────────────────────────────────

/**
 * Start a simple interval-based scheduler.
 * Each task runs independently on its own cadence.
 * An initial run of all tasks fires immediately on start.
 */
export function startScheduler(): void {
  logger.info('Starting scheduler (events=6h, products=12h, hotels=24h)');

  // Stagger the initial runs slightly so they don't all fire at once
  setTimeout(() => runEvents().then(printDashboard), 0);
  setTimeout(() => runProducts(), 10_000);
  setTimeout(() => runHotels(), 20_000);

  // Register recurring intervals
  timers.push(setInterval(() => runEvents().then(printDashboard),   SCHEDULE.eventsIntervalMs));
  timers.push(setInterval(() => runProducts(),                       SCHEDULE.productsIntervalMs));
  timers.push(setInterval(() => runHotels(),                         SCHEDULE.hotelsIntervalMs));

  // Print dashboard every 30 minutes so the terminal always shows current state
  timers.push(setInterval(() => printDashboard(), 30 * 60 * 1000));
}

// ─── Graceful shutdown ────────────────────────────────────────────────────────

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info({ signal }, 'Received shutdown signal, stopping...');

  // Clear all scheduled timers
  for (const t of timers) clearInterval(t);

  // Close all database pools and browser instances
  try {
    await Promise.allSettled([
      closeBrowser(),
      closeEnricherBrowser(),
      closePool(),
      closeHotelPool(),
    ]);
  } catch (err) {
    logger.error({ err }, 'Error during shutdown cleanup');
  }

  logger.info('Shutdown complete');
  process.exit(0);
}

process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// ─── CLI entry point ──────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  const once         = args.includes('--once');
  const eventsOnly   = args.includes('--events-only');
  const productsOnly = args.includes('--products-only');
  const hotelsOnly   = args.includes('--hotels-only');

  if (eventsOnly) {
    logger.info('Mode: events-only');
    await runEvents();
    printDashboard();
    await shutdown('manual');
    return;
  }

  if (productsOnly) {
    logger.info('Mode: products-only');
    await runProducts();
    printDashboard();
    await shutdown('manual');
    return;
  }

  if (hotelsOnly) {
    logger.info('Mode: hotels-only');
    await runHotels();
    printDashboard();
    await shutdown('manual');
    return;
  }

  if (once) {
    logger.info('Mode: once (single full cycle)');
    await runFullCycle();
    await shutdown('manual');
    return;
  }

  // Default: start the persistent scheduler
  startScheduler();
}

main().catch((err) => {
  logger.fatal({ err }, 'Fatal error in local-runner');
  process.exit(1);
});
