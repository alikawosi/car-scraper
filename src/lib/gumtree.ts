import * as cheerio from "cheerio";

import {
  AdapterError,
  SearchCriteria,
  ScrapedCar,
  milesToKm,
  parseMileageMiles,
  parsePrice,
} from "./types";

const SITE_NAME = "gumtree";
const BASE_URL = "https://www.gumtree.com";

function slugify(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildSearchUrl(criteria: SearchCriteria): string {
  const segments = ["cars", "uk"];
  const makeSlug = slugify(criteria.make);
  const modelSlug = slugify(criteria.model);
  if (makeSlug) {
    segments.push(makeSlug);
  }
  if (modelSlug) {
    segments.push(modelSlug);
  }
  const path = `/${segments.join("/")}`;
  const params = new URLSearchParams();
  params.set("sort", criteria.sort ?? "date");
  if (
    typeof criteria.minPrice === "number" ||
    typeof criteria.maxPrice === "number"
  ) {
    const min =
      typeof criteria.minPrice === "number" ? Math.floor(criteria.minPrice) : 0;
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
    params.set("body-type", slugify(criteria.bodyType) ?? criteria.bodyType);
  }
  if (criteria.page && criteria.page > 1) {
    params.set("page", String(criteria.page));
  }
  return `${BASE_URL}${path}?${params.toString()}`;
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    },
  });
  if (!response.ok) {
    throw new AdapterError(`Gumtree returned ${response.status}`);
  }
  return response.text();
}

export async function searchGumtree(criteria: SearchCriteria): Promise<{
  cars: ScrapedCar[];
  sourceUrl: string;
}> {
  const url = buildSearchUrl(criteria);
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  $("style").remove();
  const cards = $("article[data-q='search-result']");
  const limit = criteria.limit ?? 16;
  const cars: ScrapedCar[] = [];

  cards.each((index, element) => {
    if (cars.length >= limit) {
      return false;
    }
    const anchor = $(element).find("a[data-q='search-result-anchor']").first();
    const title =
      anchor
        .find("[class*='title']")
        .first()
        .text()
        .replace(/\s+/g, " ")
        .trim() ||
      anchor.text().replace(/\s+/g, " ").trim() ||
      "Gumtree Listing";

    // Capture all text content from the card to ensure we find mileage
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

    // 1. Structured extraction using data-q attributes
    // Look for: <li ...><div data-q="car-attributes-name">Mileage</div><div data-q="car-attributes-value">6,959<!-- --> miles</div></li>
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
            return false; // break loop
          }
        }
      });

    // 2. Fallback regexes
    const mileageRegex = /([\d,]+)\s*miles/i;

    let mileageMiles =
      parseMileageMiles(structuredMileage) ??
      parseMileageMiles(attributesText.match(mileageRegex)?.[1] ?? null) ??
      parseMileageMiles(cardText.match(mileageRegex)?.[1] ?? null);

    // 3. Final heuristic fallback
    if (!mileageMiles) {
      // Try to find a number between 100 and 300,000 that isn't the year (1990-2025) or price
      const potentialNumbers = attributesText.matchAll(
        /(\b\d{1,3}(?:,\d{3})*\b|\b\d+\b)/g
      );
      for (const match of potentialNumbers) {
        const val = parseMileageMiles(match[0]);
        if (val && val > 100 && val < 300000 && (val < 1990 || val > 2025)) {
          // Assume it's mileage if it's not a year-like number
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
      : `${BASE_URL}${relativeLink}`;
    const listingId =
      relativeLink.split("/").filter(Boolean).pop() ||
      `${SITE_NAME}-${index + 1}`;

    const sellerType = /Trade/i.test(attributesText)
      ? "trade"
      : /Private/i.test(attributesText)
      ? "private"
      : undefined;

    // Use structured attributes for subtitle if available, with nice separators
    const subtitle =
      attributeValues.length > 0
        ? attributeValues.join(" - ")
        : attributesText || undefined;

    cars.push({
      listingId,
      website: SITE_NAME,
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

  return { cars, sourceUrl: url };
}
