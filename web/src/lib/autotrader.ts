import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import {
  AdapterError,
  AUTOTRADER_BASE_URL,
  AUTOTRADER_SEARCH_PATH,
  SearchCriteria,
  ScrapedCar,
  parseMileageMiles,
  parsePrice,
  milesToKm,
} from "./types";

// Force local chromium for development
if (process.env.NODE_ENV === "development") {
  // chromium.setHeadlessMode = true; // Removed to fix type error
  chromium.setGraphicsMode = false;
}

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

export function buildSearchUrl(criteria: SearchCriteria): string {
  const params = new URLSearchParams();
  params.set("channel", criteria.channel ?? "cars");
  params.set("sort", criteria.sort ?? "most-recent");
  if (criteria.bodyType) {
    params.set("body-type", criteria.bodyType);
  }
  if (criteria.make) {
    params.set("make", criteria.make);
  }
  if (criteria.model) {
    params.set("model", criteria.model);
  }
  if (criteria.postcode) {
    params.set("postcode", criteria.postcode.trim());
  }
  if (typeof criteria.radius === "number") {
    params.set("radius", String(criteria.radius));
  }
  if (typeof criteria.minYear === "number") {
    params.set("year-from", String(criteria.minYear));
  }
  if (typeof criteria.maxYear === "number") {
    params.set("year-to", String(criteria.maxYear));
  }
  if (typeof criteria.minPrice === "number") {
    params.set("price-from", String(Math.floor(criteria.minPrice)));
  }
  if (typeof criteria.maxPrice === "number") {
    params.set("price-to", String(Math.floor(criteria.maxPrice)));
  }
  if (typeof criteria.minMileage === "number") {
    params.set("minimum-mileage", String(Math.floor(criteria.minMileage)));
  }
  if (typeof criteria.maxMileage === "number") {
    params.set("maximum-mileage", String(Math.floor(criteria.maxMileage)));
  }
  if (typeof criteria.minEngineSize === "number") {
    params.set("minimum-badge-engine-size", criteria.minEngineSize.toFixed(1));
  }
  if (typeof criteria.maxEngineSize === "number") {
    params.set("maximum-badge-engine-size", criteria.maxEngineSize.toFixed(1));
  }
  if (criteria.colours?.length) {
    for (const colour of criteria.colours) {
      if (colour) {
        params.append("colour", colour);
      }
    }
  }
  if (criteria.transmissions?.length) {
    for (const transmission of criteria.transmissions) {
      if (transmission) {
        params.append("transmission", transmission);
      }
    }
  }
  if (criteria.fuelType) {
    params.set("fuel-type", criteria.fuelType);
  }
  if (criteria.sellerType) {
    params.set("seller-type", criteria.sellerType);
  }
  if (criteria.doors) {
    params.set("quantity-of-doors", String(criteria.doors));
  }
  if (criteria.seats) {
    params.set("seats_values", String(criteria.seats));
  }
  if (criteria.page && criteria.page > 1) {
    params.set("page", String(criteria.page));
  }

  const query = params.toString();
  return `${AUTOTRADER_BASE_URL}${AUTOTRADER_SEARCH_PATH}?${query}`;
}

export async function scrapeAutoTrader(criteria: SearchCriteria): Promise<{
  cars: ScrapedCar[];
  url: string;
}> {
  const url = buildSearchUrl(criteria);
  
  let executablePath: string;
  if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
    executablePath = await chromium.executablePath();
  } else {
    // For local development, use a locally installed Chrome/Chromium
    // You might need to adjust this path based on your OS and Chrome installation
    // Or set a PUPPETEER_EXECUTABLE_PATH env var
    executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || 
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"; // Example for macOS
  }

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath,
    headless: chromium.headless,
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
    );
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    const blocked = await page.evaluate(() => {
      return document.title.includes("Attention Required");
    });
    if (blocked) {
      throw new AdapterError(
        "AutoTrader blocked the headless browser request. Please try again later."
      );
    }

    // AutoTrader sometimes needs a cookie consent or returns 0 results if blocked
    // We'll just wait for listings or timeout
    try {
      await page.waitForFunction(
        () =>
          document.querySelectorAll("[data-testid='search-listing-title']")
            .length > 0,
        { timeout: 10000 } 
      );
    } catch {
      // No results found or timeout
      return { cars: [], url };
    }

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

    return { cars, url };
  } catch (error) {
    if (error instanceof AdapterError) {
      throw error;
    }
    throw new AdapterError(
      `Failed to fetch AutoTrader data: ${(error as Error).message}`
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export async function searchAutoTrader(criteria: SearchCriteria): Promise<{
  cars: ScrapedCar[];
  sourceUrl: string;
}> {
  const { cars, url } = await scrapeAutoTrader(criteria);
  return { cars, sourceUrl: url };
}
