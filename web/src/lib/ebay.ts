import { EbayScraper } from "./scrapers/EbayScraper";
import { SearchCriteria, ScrapedCar } from "./types";

/**
 * Search eBay for car listings
 * @deprecated Use EbayScraper class directly for better control
 */
export async function searchEbay(criteria: SearchCriteria): Promise<{
  cars: ScrapedCar[];
  sourceUrl: string;
}> {
  const scraper = new EbayScraper();
  return scraper.search(criteria);
}
