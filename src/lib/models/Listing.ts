import { Listing as IListing } from "@/lib/types";

export class ListingModel {
  constructor(private data: IListing) {}

  get id() { return this.data.listingId; }
  get title() { return this.data.title; }
  get subtitle() { return this.data.subtitle; }
  get price() { return this.data.price; }
  get formattedPrice() { return `£${this.data.price.toLocaleString("en-GB")}`; }
  get mileage() { return this.data.mileageMiles; }
  get formattedMileage() { return this.data.mileageMiles ? `${this.data.mileageMiles.toLocaleString("en-GB")} miles` : undefined; }
  get image() { return this.data.image; }
  get location() { return this.data.location; }
  get website() { return this.data.website; }
  get link() { return this.data.link; }
  get sellerType() { return this.data.sellerType; }
  get plate() { return this.data.licensePlate ?? "UNKNOWN"; }
  get valuation() { return this.data.valuation; }
  
  get hasValuation() { return !!this.data.valuation; }

  get valuationSummary() {
    if (!this.data.valuation) return null;
    return {
      fairPrice: `£${this.data.valuation.fair_price.toLocaleString("en-GB")}`,
      range: `£${this.data.valuation.range_low.toLocaleString("en-GB")} – £${this.data.valuation.range_high.toLocaleString("en-GB")}`,
      notes: this.data.valuation.notes
    };
  }
}

