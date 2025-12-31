import { GumtreeScraper } from "./scrapers/GumtreeScraper";
import { SearchCriteria, ScrapedCar } from "./types";

/**
 * Search Gumtree for car listings
 * @deprecated Use GumtreeScraper class directly for better control
 */
export async function searchGumtree(criteria: SearchCriteria): Promise<{
  cars: ScrapedCar[];
  sourceUrl: string;
}> {
  const scraper = new GumtreeScraper();
  return scraper.search(criteria);
}
