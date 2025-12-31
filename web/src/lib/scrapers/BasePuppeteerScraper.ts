import puppeteer, { Browser, Page } from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { AdapterError, SearchCriteria, ScrapedCar } from "../types";

/**
 * Abstract base class for Puppeteer-based web scrapers
 * Handles common browser management, navigation, and lifecycle
 */
export abstract class BasePuppeteerScraper {
  protected readonly siteName: string;
  protected browser: Browser | null = null;

  constructor(siteName: string) {
    this.siteName = siteName;
  }

  /**
   * Main search method - orchestrates the scraping flow
   */
  async search(criteria: SearchCriteria): Promise<{
    cars: ScrapedCar[];
    sourceUrl: string;
  }> {
    const url = this.buildSearchUrl(criteria);

    try {
      await this.launchBrowser();
      const page = await this.createPage();
      await this.navigateToUrl(page, url);
      await this.waitForContent(page);
      const html = await page.content();
      const cars = await this.parseHtml(html, criteria, url);

      return { cars, sourceUrl: url };
    } catch (error) {
      throw new AdapterError(
        `${this.siteName} scraper failed: ${(error as Error).message}`
      );
    } finally {
      await this.closeBrowser();
    }
  }

  /**
   * Launch Puppeteer browser with appropriate configuration
   */
  protected async launchBrowser(): Promise<void> {
    const isProduction =
      process.env.NODE_ENV === "production" || process.env.VERCEL;
    const executablePath = isProduction
      ? await chromium.executablePath()
      : "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

    this.browser = await puppeteer.launch({
      args: isProduction ? chromium.args : ["--no-sandbox"],
      executablePath,
      // @ts-ignore - chromium.headless type mismatch
      headless: chromium.headless === "shell" ? "shell" : !!chromium.headless,
      defaultViewport: { width: 1920, height: 1080 },
    });
  }

  /**
   * Create a new page with configured user agent
   */
  protected async createPage(): Promise<Page> {
    if (!this.browser) {
      throw new Error("Browser not initialized");
    }

    const page = await this.browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    );

    return page;
  }

  /**
   * Navigate to URL with retry logic
   */
  protected async navigateToUrl(page: Page, url: string): Promise<void> {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
  }

  /**
   * Close the browser and cleanup resources
   */
  protected async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // ============================================
  // Abstract methods - must be implemented by subclasses
  // ============================================

  /**
   * Build the search URL based on criteria
   * Each site has different URL structure and parameters
   */
  protected abstract buildSearchUrl(criteria: SearchCriteria): string;

  /**
   * Wait for page content to load
   * Each site has different loading indicators
   */
  protected abstract waitForContent(page: Page): Promise<void>;

  /**
   * Parse HTML and extract car listings
   * Each site has different HTML structure
   */
  protected abstract parseHtml(
    html: string,
    criteria: SearchCriteria,
    url: string
  ): Promise<ScrapedCar[]>;
}

