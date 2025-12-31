import * as cheerio from "cheerio";
import { Page } from "puppeteer-core";
import {
  SearchCriteria,
  ScrapedCar,
  parseMileageMiles,
  parsePrice,
  milesToKm,
} from "../types";
import { BasePuppeteerScraper } from "./BasePuppeteerScraper";

export class GumtreeScraper extends BasePuppeteerScraper {
  private readonly BASE_URL = "https://www.gumtree.com";

  constructor() {
    super("gumtree");
  }

  protected buildSearchUrl(criteria: SearchCriteria): string {
    const segments = ["cars", "uk"];
    const makeSlug = this.slugify(criteria.make);
    const modelSlug = this.slugify(criteria.model);

    if (makeSlug) segments.push(makeSlug);
    if (modelSlug) segments.push(modelSlug);

    const path = `/${segments.join("/")}`;
    const params = new URLSearchParams();

    params.set("sort", criteria.sort ?? "date");

    if (
      typeof criteria.minPrice === "number" ||
      typeof criteria.maxPrice === "number"
    ) {
      const min =
        typeof criteria.minPrice === "number"
          ? Math.floor(criteria.minPrice)
          : 0;
      const max =
        typeof criteria.maxPrice === "number"
          ? Math.floor(criteria.maxPrice)
          : "";
      params.set("price", `${min}_${max}`);
    }

    if (typeof criteria.maxMileage === "number") {
      const min =
        typeof criteria.minMileage === "number"
          ? Math.floor(criteria.minMileage)
          : 0;
      params.set("mileage", `${min}_${Math.floor(criteria.maxMileage)}`);
    }

    if (criteria.bodyType) {
      params.set(
        "body-type",
        this.slugify(criteria.bodyType) ?? criteria.bodyType
      );
    }

    if (criteria.page && criteria.page > 1) {
      params.set("page", String(criteria.page));
    }

    return `${this.BASE_URL}${path}?${params.toString()}`;
  }

  protected async waitForContent(page: Page): Promise<void> {
    try {
      await page.waitForFunction(
        () => {
          const articles = document.querySelectorAll("article");
          return articles.length > 0;
        },
        { timeout: 10000 }
      );
    } catch {
      throw new Error("No Gumtree listings found or timeout");
    }
  }

  protected async parseHtml(
    html: string,
    criteria: SearchCriteria,
    url: string
  ): Promise<ScrapedCar[]> {
    if (!html) return [];

    const $ = cheerio.load(html);
    $("style").remove();

    const cards = $("article[data-q='search-result']");
    const limit = criteria.limit ?? 16;
    const cars: ScrapedCar[] = [];

    cards.each((index, element) => {
      if (cars.length >= limit) {
        return false;
      }

      const anchor = $(element)
        .find("a[data-q='search-result-anchor']")
        .first();
      const title =
        anchor
          .find("[class*='title']")
          .first()
          .text()
          .replace(/\s+/g, " ")
          .trim() ||
        anchor.text().replace(/\s+/g, " ").trim() ||
        "Gumtree Listing";

      // Capture all text content from the card
      const cardText = $(element).text().replace(/\s+/g, " ").trim();
      const priceMatch = cardText.match(/£[\d,]+/);

      // Extract structured attributes
      const attributeValues: string[] = [];
      $(element)
        .find("div[data-q='car-attributes-value']")
        .each((_, valEl) => {
          const val = $(valEl).text().trim();
          if (val) attributeValues.push(val);
        });

      const attributesText = $(element)
        .find("[class*='attributes']")
        .first()
        .text()
        .replace(/\s+/g, " ")
        .trim();

      const location = $(element)
        .find("[class*='location']")
        .first()
        .text()
        .replace(/\s+/g, " ")
        .trim();

      // Extract mileage with multiple strategies
      let structuredMileage: string | undefined;
      $(element)
        .find("div[data-q='car-attributes-name']")
        .each((_, nameEl) => {
          const label = $(nameEl).text().trim();
          if (/Mileage/i.test(label)) {
            const valEl = $(nameEl).siblings(
              "div[data-q='car-attributes-value']"
            );
            if (valEl.length) {
              structuredMileage = valEl.text().trim();
              return false;
            }
          }
        });

      const mileageRegex = /([\d,]+)\s*miles/i;
      let mileageMiles =
        parseMileageMiles(structuredMileage) ??
        parseMileageMiles(attributesText.match(mileageRegex)?.[1] ?? null) ??
        parseMileageMiles(cardText.match(mileageRegex)?.[1] ?? null);

      // Heuristic fallback for mileage
      if (!mileageMiles) {
        const potentialNumbers = attributesText.matchAll(
          /(\b\d{1,3}(?:,\d{3})*\b|\b\d+\b)/g
        );
        for (const match of potentialNumbers) {
          const val = parseMileageMiles(match[0]);
          if (val && val > 100 && val < 300000 && (val < 1990 || val > 2025)) {
            mileageMiles = val;
            break;
          }
        }
      }

      const image =
        anchor.find("img").first().attr("data-src") ||
        anchor.find("img").first().attr("data-lazy-src") ||
        anchor.find("img").first().attr("src");

      const relativeLink = anchor.attr("href") ?? "";
      const link = relativeLink.startsWith("http")
        ? relativeLink
        : `${this.BASE_URL}${relativeLink}`;

      const listingId =
        relativeLink.split("/").filter(Boolean).pop() ||
        `gumtree-${index + 1}`;

      const sellerType = /Trade/i.test(attributesText)
        ? "trade"
        : /Private/i.test(attributesText)
        ? "private"
        : undefined;

      const subtitle =
        attributeValues.length > 0
          ? attributeValues.join(" - ")
          : attributesText || undefined;

      cars.push({
        listingId,
        website: "gumtree",
        title,
        subtitle,
        link,
        price: parsePrice(priceMatch?.[0] ?? null),
        currency: "GBP",
        mileageMiles,
        mileageKm: milesToKm(mileageMiles),
        location: location || undefined,
        image,
        sellerType,
        textBlock: cardText,
      });
    });

    return cars;
  }

  /**
   * Helper method to slugify strings for URL segments
   */
  private slugify(value?: string): string | undefined {
    if (!value) return undefined;
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}

