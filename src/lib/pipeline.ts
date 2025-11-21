import { searchAutoTrader } from "./autotrader";
import { searchEbay } from "./ebay";
import { searchGumtree } from "./gumtree";
import { readPlateFromImage, valueCar } from "./openai";
import { Listing, ScrapedCar, SearchCriteria, SearchEvent, Website } from "./types";

type Adapter = {
  key: Website;
  run: (criteria: SearchCriteria) => Promise<{ cars: ScrapedCar[]; sourceUrl: string }>;
};

export async function* runSearchGenerator(
  criteria: SearchCriteria
): AsyncGenerator<SearchEvent> {
  const allAdapters: Adapter[] = [
    { key: "autotrader", run: searchAutoTrader },
    { key: "ebay", run: searchEbay },
    { key: "gumtree", run: searchGumtree },
  ];

  const enabledAdapters = criteria.sources && criteria.sources.length > 0
    ? allAdapters.filter(a => criteria.sources!.includes(a.key))
    : allAdapters;

  // Use a Map to ensure globally unique listings by ID
  // Key format: "{website}-{listingId}"
  const uniqueCars = new Map<string, ScrapedCar>();
  const sourceUrls: Record<string, string> = {};

  // 1. Scrape Phase
  for (const adapter of enabledAdapters) {
    try {
      const { cars, sourceUrl } = await adapter.run(criteria);
      if (cars.length) {
        sourceUrls[adapter.key] = sourceUrl;
        
        for (const car of cars) {
          // Create a composite ID to ensure uniqueness across different websites
          // and to serve as a reliable key for deduplication
          const compositeId = `${car.website}-${car.listingId}`;
          
          if (!uniqueCars.has(compositeId)) {
            // We update the listingId to the composite one to prevent React key collisions
            // if different sites happen to use the same ID, and to ensure consistent referencing.
            uniqueCars.set(compositeId, {
              ...car,
              listingId: compositeId
            });
          }
        }
      }
    } catch (error) {
      console.warn(
        `Adapter ${adapter.key} failed: ${(error as Error).message}`
      );
      yield {
        type: "error",
        message: `Adapter ${adapter.key} failed: ${(error as Error).message}`,
      };
    }
  }

  if (uniqueCars.size === 0) {
    return;
  }

  // 2. Initial Yield (All cars as "analyzing")
  const initialListings: Listing[] = Array.from(uniqueCars.values()).map((car) => ({
    ...car,
    status: "analyzing",
  }));

  yield { type: "listings", listings: initialListings };

  // 3. Enrichment Phase (Streaming updates)
  for (const car of initialListings) {
    try {
      const plate = await readPlateFromImage(car.image);
      const valuation = await valueCar(car, plate);
      
      const updatedTitle = plate && plate !== "UNKNOWN"
          ? `${car.title} (Plate: ${plate})`
          : car.title;

      yield {
        type: "update",
        id: car.listingId,
        update: {
          licensePlate: plate,
          valuation,
          title: updatedTitle,
          status: "complete",
        },
      };
    } catch (error) {
      console.error(`Enrichment failed for ${car.listingId}`, error);
      yield {
        type: "update",
        id: car.listingId,
        update: { status: "failed" },
      };
    }
  }
}
