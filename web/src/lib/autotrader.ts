import { AutoTraderScraper } from "./scrapers/AutoTraderScraper";
import { SearchCriteria, ScrapedCar } from "./types";

/**
 * Search AutoTrader for car listings
 * @deprecated Use AutoTraderScraper class directly for better control
 */
export async function searchAutoTrader(criteria: SearchCriteria): Promise<{
  cars: ScrapedCar[];
  sourceUrl: string;
}> {
  const scraper = new AutoTraderScraper();
  return scraper.search(criteria);
}
