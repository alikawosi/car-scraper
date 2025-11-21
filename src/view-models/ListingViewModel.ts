import { Listing, ListingStatus, BadgeType } from "@/lib/types";

export type { BadgeType };

export class ListingViewModel {
  private listing: Listing;

  constructor(listing: Listing) {
    this.listing = listing;
  }

  get id(): string {
    return this.listing.listingId;
  }

  get title(): string {
    return this.listing.title;
  }

  get subtitle(): string {
    return this.listing.subtitle || "";
  }

  get price(): string {
    return `£${this.listing.price.toLocaleString("en-GB")}`;
  }

  get mileage(): string | null {
    return this.listing.mileageMiles
      ? `${this.listing.mileageMiles.toLocaleString("en-GB")} miles`
      : null;
  }

  get location(): string {
    return this.listing.location || "";
  }

  get imageUrl(): string | null {
    return this.listing.image || null;
  }

  get sellerType(): string | null {
    return this.listing.sellerType || null;
  }

  get status(): ListingStatus {
    return this.listing.status || "complete"; // Default to complete for backward compat
  }

  get isAnalyzing(): boolean {
    return this.status === "analyzing" || this.status === "scraped";
  }

  get priceRating(): { label: string; type: BadgeType } | null {
    if (this.status !== "complete" || !this.listing.valuation) return null;

    const { price } = this.listing;
    const { fair_price, range_low, range_high } = this.listing.valuation;

    // Simple heuristic logic for demo purposes
    if (price < range_low) {
      return { label: "Great price", type: "great" }; // Deep green
    } else if (price <= fair_price) {
      return { label: "Good price", type: "good" }; // Green
    } else if (price <= range_high) {
      return { label: "Fair price", type: "fair" }; // Blue/Neutral
    } else {
      return { label: "High price", type: "high" }; // Red/Orange
    }
  }

  get plate(): string | undefined {
    return this.listing.licensePlate;
  }

  get website(): string {
    return this.listing.website;
  }

  get link(): string {
    return this.listing.link;
  }

  get yearTag(): string | null {
    return null;
  }
}
