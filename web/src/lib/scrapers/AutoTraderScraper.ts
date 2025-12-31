import { Page } from "puppeteer-core";
import {
  AdapterError,
  AUTOTRADER_BASE_URL,
  AUTOTRADER_SEARCH_PATH,
  SearchCriteria,
  ScrapedCar,
  parseMileageMiles,
  parsePrice,
  milesToKm,
} from "../types";
import { BasePuppeteerScraper } from "./BasePuppeteerScraper";

type RawCard = {
  title: string;
  subtitle?: string;
  attention?: string;
  location?: string;
  seller?: string;
  image?: string;
  link?: string;
  textBlock?: string;
};

export class AutoTraderScraper extends BasePuppeteerScraper {
  constructor() {
    super("autotrader");
  }

  protected buildSearchUrl(criteria: SearchCriteria): string {
    const params = new URLSearchParams();
    params.set("channel", criteria.channel ?? "cars");
    params.set("sort", criteria.sort ?? "most-recent");

    if (criteria.bodyType) params.set("body-type", criteria.bodyType);
    if (criteria.make) params.set("make", criteria.make);
    if (criteria.model) params.set("model", criteria.model);
    if (criteria.postcode) params.set("postcode", criteria.postcode.trim());
    if (typeof criteria.radius === "number")
      params.set("radius", String(criteria.radius));
    if (typeof criteria.minYear === "number")
      params.set("year-from", String(criteria.minYear));
    if (typeof criteria.maxYear === "number")
      params.set("year-to", String(criteria.maxYear));
    if (typeof criteria.minPrice === "number")
      params.set("price-from", String(Math.floor(criteria.minPrice)));
    if (typeof criteria.maxPrice === "number")
      params.set("price-to", String(Math.floor(criteria.maxPrice)));
    if (typeof criteria.minMileage === "number")
      params.set("minimum-mileage", String(Math.floor(criteria.minMileage)));
    if (typeof criteria.maxMileage === "number")
      params.set("maximum-mileage", String(Math.floor(criteria.maxMileage)));
    if (typeof criteria.minEngineSize === "number")
      params.set(
        "minimum-badge-engine-size",
        criteria.minEngineSize.toFixed(1)
      );
    if (typeof criteria.maxEngineSize === "number")
      params.set(
        "maximum-badge-engine-size",
        criteria.maxEngineSize.toFixed(1)
      );

    if (criteria.colours?.length) {
      for (const colour of criteria.colours) {
        if (colour) params.append("colour", colour);
      }
    }
    if (criteria.transmissions?.length) {
      for (const transmission of criteria.transmissions) {
        if (transmission) params.append("transmission", transmission);
      }
    }
    if (criteria.fuelType) {
      params.set("fuel-type", criteria.fuelType);
    }
    if (criteria.doors) {
      params.set("quantity-of-doors", String(criteria.doors));
    }
    if (criteria.seats) {
      params.set("seats_values", String(criteria.seats));
    }
    if (criteria.sellerType) {
      params.set("seller-type", criteria.sellerType);
    }
    if (criteria.page && criteria.page > 1) {
      params.set("page", String(criteria.page));
    }

    const query = params.toString();
    return `${AUTOTRADER_BASE_URL}${AUTOTRADER_SEARCH_PATH}?${query}`;
  }

  protected async waitForContent(page: Page): Promise<void> {
    // Check for blocking page
    const blocked = await page.evaluate(() => {
      return document.title.includes("Attention Required");
    });

    if (blocked) {
      throw new AdapterError(
        "AutoTrader blocked the request. Please try again later."
      );
    }

    // Wait for listings to appear
    try {
      await page.waitForFunction(
        () =>
          document.querySelectorAll("[data-testid='search-listing-title']")
            .length > 0,
        { timeout: 10000 }
      );
    } catch {
      // No results found - this is OK, return empty
      throw new Error("No listings found");
    }
  }

  protected async parseHtml(
    html: string,
    criteria: SearchCriteria,
    url: string
  ): Promise<ScrapedCar[]> {
    // Use page.evaluate to extract data in browser context
    const browser = this.browser;
    if (!browser) throw new Error("Browser not initialized");

    const pages = await browser.pages();
    const page = pages[pages.length - 1];

    const rawCards: RawCard[] = await page.evaluate(() => {
      const nodes = Array.from(
        document.querySelectorAll<HTMLElement>("[data-testid^='advertCard-']")
      );
      return nodes.map((card) => {
        const titleLink = card.querySelector<HTMLAnchorElement>(
          "[data-testid='search-listing-title']"
        );
        const titleParts: string[] = [];
        if (titleLink?.childNodes?.length) {
          const [headlineNode] = Array.from(titleLink.childNodes).filter(
            (child) => child.nodeType === Node.TEXT_NODE
          );
          if (headlineNode?.textContent) {
            titleParts.push(headlineNode.textContent.trim());
          }
        }
        const detail = titleLink?.querySelector("span")?.textContent?.trim();
        if (detail) {
          titleParts.push(detail);
        }

        return {
          title:
            titleParts.join(" ").trim() || titleLink?.textContent?.trim() || "",
          subtitle: card
            .querySelector<HTMLElement>(
              "[data-testid='search-listing-subtitle']"
            )
            ?.textContent?.trim(),
          attention: card
            .querySelector<HTMLElement>(
              "[data-testid='search-listing-attention-grabber']"
            )
            ?.textContent?.trim(),
          location: card
            .querySelector<HTMLElement>(
              "[data-testid='search-listing-location']"
            )
            ?.textContent?.trim(),
          seller:
            card
              .querySelector<HTMLElement>("[data-testid='private-seller']")
              ?.textContent?.trim() || undefined,
          image:
            card.querySelector<HTMLImageElement>("picture img")?.src ||
            undefined,
          link: titleLink?.getAttribute("href") || undefined,
          textBlock: card.innerText,
        };
      });
    });

    const limit = criteria.limit ?? 16;
    const cars = rawCards.slice(0, limit).map((raw, index) => {
      const priceMatch =
        raw.title.match(/£[\d,]+/) ?? raw.textBlock?.match(/£[\d,]+/);
      const mileageMatch = raw.textBlock?.match(/([\d,]+)\s+miles/i);
      const location = raw.location
        ?.replace(/(Dealer|Private)\s+location/gi, "")
        .trim();
      const relativeLink = raw.link ?? "";
      const listingId =
        relativeLink.match(/car-details\/([^?]+)/)?.[1] ??
        `autotrader-${index + 1}`;
      const href = relativeLink
        ? new URL(relativeLink, AUTOTRADER_BASE_URL).href
        : AUTOTRADER_BASE_URL;

      const mileageMiles = parseMileageMiles(mileageMatch?.[1] ?? null);

      const card: ScrapedCar = {
        listingId,
        website: "autotrader",
        title: raw.title || "AutoTrader Listing",
        subtitle: raw.subtitle || raw.attention,
        link: href,
        price: parsePrice(priceMatch?.[0] ?? null),
        currency: "GBP",
        mileageMiles,
        mileageKm: milesToKm(mileageMiles),
        location,
        image: raw.image,
        sellerType: raw.seller,
        textBlock: raw.textBlock,
      };
      return card;
    });

    return cars;
  }
}

