/**
 * Car Scraper Library - OOP Architecture
 * 
 * This module provides a clean object-oriented architecture for web scraping
 * car listings from multiple sources using Puppeteer.
 * 
 * @example
 * ```typescript
 * import { AutoTraderScraper } from '@/lib/scrapers';
 * 
 * const scraper = new AutoTraderScraper();
 * const result = await scraper.search({
 *   make: 'BMW',
 *   model: '3 Series',
 *   postcode: 'SW1A 1AA',
 *   radius: 50
 * });
 * ```
 */

export { BasePuppeteerScraper } from "./BasePuppeteerScraper";
export { AutoTraderScraper } from "./AutoTraderScraper";
export { EbayScraper } from "./EbayScraper";
export { GumtreeScraper } from "./GumtreeScraper";

