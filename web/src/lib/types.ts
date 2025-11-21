export interface SearchCriteria {
  channel?: string;
  bodyType?: string;
  make?: string;
  model?: string;
  minYear?: number;
  maxYear?: number;
  minPrice?: number;
  maxPrice?: number;
  minMileage?: number;
  maxMileage?: number;
  minEngineSize?: number;
  maxEngineSize?: number;
  postcode?: string;
  radius?: number;
  colours?: string[];
  transmissions?: string[];
  sellerType?: "private" | "trade";
  fuelType?: string;
  doors?: number;
  seats?: number;
  sort?: string;
  limit?: number;
  page?: number;
  sources?: Website[];
}

export type Website = "autotrader" | "ebay" | "gumtree";

export interface ScrapedCar {
  listingId: string;
  website: Website;
  title: string;
  subtitle?: string;
  link: string;
  price: number;
  currency: string;
  mileageMiles?: number;
  mileageKm?: number;
  location?: string;
  image?: string;
  sellerType?: string;
  textBlock?: string;
}

export interface CarValuation {
  fair_price: number;
  range_low: number;
  range_high: number;
  confidence: number;
  notes: string;
}

export type ListingStatus = "scraped" | "analyzing" | "complete" | "failed";

export type BadgeType = "great" | "good" | "fair" | "high" | "neutral";

export interface Listing extends ScrapedCar {
  licensePlate?: string;
  valuation?: CarValuation;
  status?: ListingStatus;
}

export type SearchEvent =
  | { type: "listings"; listings: Listing[] }
  | { type: "update"; id: string; update: Partial<Listing> }
  | { type: "error"; message: string };

export interface SearchRequestBody {
  criteria: SearchCriteria;
}

export interface SearchResponse {
  criteria: SearchCriteria;
  sourceUrls: Record<string, string>;
  listings: Listing[];
}

export class AdapterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdapterError";
  }
}

export const AUTOTRADER_BASE_URL = "https://www.autotrader.co.uk";
export const AUTOTRADER_SEARCH_PATH = "/car-search";

export function parsePrice(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }
  const match = value.replace(/[,£\s]/g, "");
  const numeric = Number(match);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function parseMileageMiles(
  value: string | null | undefined
): number | undefined {
  if (!value) {
    return undefined;
  }
  const match = value.replace(/[^\d]/g, "");
  if (!match) {
    return undefined;
  }
  const parsed = Number(match);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function milesToKm(miles?: number): number | undefined {
  if (!miles && miles !== 0) {
    return undefined;
  }
  return Math.round(miles * 1.60934);
}
