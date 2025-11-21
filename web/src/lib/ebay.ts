import * as cheerio from "cheerio";

import {
  AdapterError,
  SearchCriteria,
  ScrapedCar,
  milesToKm,
  parseMileageMiles,
  parsePrice,
} from "./types";

const SITE_NAME = "ebay";
const BASE_URL = "https://www.ebay.co.uk/sch/Cars-/9801/i.html";

function buildSearchUrl(criteria: SearchCriteria): string {
  const params = new URLSearchParams();
  const keywords: string[] = [];
  if (criteria.make) {
    keywords.push(criteria.make);
  }
  if (criteria.model) {
    keywords.push(criteria.model);
  }
  if (criteria.bodyType) {
    keywords.push(criteria.bodyType);
  }
  if (keywords.length) {
    params.set("_nkw", keywords.join(" "));
  }
  if (typeof criteria.minPrice === "number") {
    params.set("_udlo", String(Math.floor(criteria.minPrice)));
  }
  if (typeof criteria.maxPrice === "number") {
    params.set("_udhi", String(Math.floor(criteria.maxPrice)));
  }
  params.set("_sop", criteria.sort === "price-asc" ? "15" : "10"); // 10 = newly listed, 15 = price asc
  if (criteria.page && criteria.page > 1) {
    params.set("_pgn", String(criteria.page));
  }
  return `${BASE_URL}?${params.toString()}`;
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
    throw new AdapterError(`eBay returned ${response.status}`);
  }
  return response.text();
}

export async function searchEbay(criteria: SearchCriteria): Promise<{
  cars: ScrapedCar[];
  sourceUrl: string;
}> {
  const url = buildSearchUrl(criteria);
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  const cards = $("li.s-item");
  const limit = criteria.limit ?? 16;
  const cars: ScrapedCar[] = [];

  cards.each((index, element) => {
    if (cars.length >= limit) {
      return false;
    }
    const title =
      $(element).find(".s-item__title").text().replace(/\s+/g, " ").trim() ||
      "eBay Listing";
    if (title === "Shop on eBay") {
      return;
    }
    const priceText = $(element)
      .find(".s-item__price")
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim();
    const mileageText = $(element)
      .find(".s-item__dynamic")
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim();
    const mileageMiles = parseMileageMiles(mileageText);
    const location = $(element)
      .find(".s-item__location")
      .first()
      .text()
      .replace(/Item location:\s*/i, "")
      .trim();
    const imageTag = $(element).find(".s-item__image-img").first();
    const image =
      imageTag.attr("src") ?? imageTag.attr("data-src") ?? undefined;
    const link =
      $(element).find(".s-item__link").attr("href") ??
      "https://www.ebay.co.uk";
    const listingId =
      $(element).attr("data-view") ||
      link.split("/").filter(Boolean).pop() ||
      `${SITE_NAME}-${index + 1}`;

    cars.push({
      listingId,
      website: SITE_NAME,
      title,
      link,
      price: parsePrice(priceText),
      currency: "GBP",
      mileageMiles,
      mileageKm: milesToKm(mileageMiles),
      location: location || undefined,
      image,
      sellerType: mileageText.includes("Dealer") ? "trade" : undefined,
      textBlock: `${title} ${mileageText}`.trim(),
    });
  });

  return { cars, sourceUrl: url };
}
