import { Page } from "puppeteer-core";
import {
  SearchCriteria,
  ScrapedCar,
  parseMileageMiles,
  parsePrice,
  milesToKm,
} from "../types";
import { BasePuppeteerScraper } from "./BasePuppeteerScraper";

type RawCard = {
  title: string;
  price: string;
  mileage: string;
  location: string;
  image?: string;
  link: string;
};

export class EbayScraper extends BasePuppeteerScraper {
  private readonly BASE_URL = "https://www.ebay.co.uk/b/Cars/9801/bn_1839671";

  constructor() {
    super("ebay");
  }

  protected buildSearchUrl(criteria: SearchCriteria): string {
    const params = new URLSearchParams();
    const keywords: string[] = [];

    if (criteria.make) keywords.push(criteria.make);
    if (criteria.model) keywords.push(criteria.model);
    if (criteria.bodyType) keywords.push(criteria.bodyType);

    if (keywords.length) {
      params.set("_nkw", keywords.join(" "));
    }
    if (typeof criteria.minPrice === "number") {
      params.set("_udlo", String(Math.floor(criteria.minPrice)));
    }
    if (typeof criteria.maxPrice === "number") {
      params.set("_udhi", String(Math.floor(criteria.maxPrice)));
    }

    // Sort: 10 = newly listed, 15 = price ascending
    params.set("_sop", criteria.sort === "price-asc" ? "15" : "10");

    if (criteria.page && criteria.page > 1) {
      params.set("_pgn", String(criteria.page));
    }

    const query = params.toString();
    return query ? `${this.BASE_URL}?${query}` : this.BASE_URL;
  }

  protected async waitForContent(page: Page): Promise<void> {
    try {
      await page.waitForFunction(
        () => {
          const cards = document.querySelectorAll("li.brwrvr__item-card");
          // Wait until we have cards AND skeleton loaders are gone
          return (
            cards.length > 0 &&
            !document.querySelector(".brw-loaders__skeleton[aria-busy='true']")
          );
        },
        { timeout: 15000 }
      );
    } catch {
      throw new Error("No eBay listings found or timeout");
    }
  }

  protected async parseHtml(
    html: string,
    criteria: SearchCriteria,
    url: string
  ): Promise<ScrapedCar[]> {
    const browser = this.browser;
    if (!browser) throw new Error("Browser not initialized");

    const pages = await browser.pages();
    const page = pages[pages.length - 1];

    // Extract car data from the page using browser context
    const rawCards: RawCard[] = await page.evaluate(() => {
      const cardNodes = Array.from(
        document.querySelectorAll<HTMLElement>("li.brwrvr__item-card")
      );
      return cardNodes
        .map((card) => {
          const title =
            card.querySelector(".bsig__title")?.textContent?.trim() || "";
          const price =
            card.querySelector(".bsig__price")?.textContent?.trim() || "";
          const mileage =
            card
              .querySelector(".bsig")
              ?.textContent?.match(/([\d,]+)\s*miles/i)?.[0] || "";
          const location =
            card.querySelector(".bsig__location")?.textContent?.trim() || "";
          const img = card.querySelector<HTMLImageElement>("img");
          const link = card.querySelector<HTMLAnchorElement>("a")?.href || "";

          return {
            title,
            price,
            mileage,
            location,
            image: img?.dataset?.src || img?.src, // Prioritize data-src for lazy-loading
            link,
          };
        })
        .filter((card) => {
          // Filter out "Shop on eBay" sponsored ads and invalid entries
          return (
            card.title &&
            card.title !== "Shop on eBay" &&
            !card.title.includes("Shop on eBay") &&
            card.link &&
            !card.link.includes("/b/bn_")
          );
        });
    });

    const limit = criteria.limit ?? 16;
    const cars: ScrapedCar[] = rawCards.slice(0, limit).map((raw, index) => {
      const mileageMiles = parseMileageMiles(raw.mileage);
      const listingId =
        raw.link.split("/").filter(Boolean).pop() || `ebay-${index + 1}`;

      // Filter out placeholder images (s_1x2.gif)
      const imageUrl =
        raw.image && !raw.image.includes("s_1x2.gif") ? raw.image : undefined;

      return {
        listingId,
        website: "ebay",
        title: raw.title || "eBay Listing",
        link: raw.link,
        price: parsePrice(raw.price),
        currency: "GBP",
        mileageMiles,
        mileageKm: milesToKm(mileageMiles),
        location: raw.location || undefined,
        image: imageUrl,
        textBlock: `${raw.title} ${raw.mileage}`.trim(),
      };
    });

    return cars;
  }
}

