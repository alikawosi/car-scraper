# Car Scraper Library - OOP Architecture

## Overview

This library provides a clean, maintainable object-oriented architecture for scraping car listings from multiple sources using Puppeteer. All scrapers inherit from a common base class, ensuring consistent behavior and reducing code duplication.

## Architecture

```
BasePuppeteerScraper (Abstract)
├── AutoTraderScraper
├── EbayScraper
└── GumtreeScraper
```

### Base Class: `BasePuppeteerScraper`

The abstract base class that handles all common Puppeteer operations:

- **Browser Management**: Launch, configure, and close browser
- **Page Creation**: Create pages with appropriate user agents
- **Navigation**: Handle page navigation with retries
- **Lifecycle**: Orchestrate the complete scraping flow

### Subclasses

Each subclass implements site-specific logic:

1. **`buildSearchUrl(criteria)`**: Constructs the search URL with appropriate parameters
2. **`waitForContent(page)`**: Waits for page-specific content to load
3. **`parseHtml(html, criteria, url)`**: Extracts car listings from HTML

## Usage

### Basic Example

```typescript
import { AutoTraderScraper } from '@/lib/scrapers';

const scraper = new AutoTraderScraper();
const result = await scraper.search({
  make: 'BMW',
  model: '3 Series',
  postcode: 'SW1A 1AA',
  radius: 50,
  minPrice: 10000,
  maxPrice: 30000,
  sellerType: 'private',
  limit: 20
});

console.log(`Found ${result.cars.length} cars`);
console.log(`Source: ${result.sourceUrl}`);
```

### Multiple Sources

```typescript
import { AutoTraderScraper, EbayScraper, GumtreeScraper } from '@/lib/scrapers';

const scrapers = [
  new AutoTraderScraper(),
  new EbayScraper(),
  new GumtreeScraper()
];

const criteria = { make: 'Tesla', model: 'Model 3' };

const results = await Promise.all(
  scrapers.map(scraper => scraper.search(criteria))
);

const allCars = results.flatMap(r => r.cars);
console.log(`Total found: ${allCars.length} cars`);
```

### Advanced: Custom Configuration

```typescript
import { BasePuppeteerScraper } from '@/lib/scrapers';
import { Page } from 'puppeteer-core';

class CustomScraper extends BasePuppeteerScraper {
  constructor() {
    super('custom-site');
  }

  protected buildSearchUrl(criteria: SearchCriteria): string {
    return `https://example.com/cars?make=${criteria.make}`;
  }

  protected async waitForContent(page: Page): Promise<void> {
    await page.waitForSelector('.car-listing', { timeout: 10000 });
  }

  protected async parseHtml(
    html: string,
    criteria: SearchCriteria,
    url: string
  ): Promise<ScrapedCar[]> {
    // Custom parsing logic
    return [];
  }
}
```

## Benefits of OOP Architecture

### 1. **DRY (Don't Repeat Yourself)**
Common Puppeteer logic is centralized in the base class, eliminating duplication across adapters.

**Before (Procedural)**:
```typescript
// autotrader.ts - 100 lines of Puppeteer code
// ebay.ts - 100 lines of DUPLICATED Puppeteer code  
// gumtree.ts - 100 lines of DUPLICATED Puppeteer code
```

**After (OOP)**:
```typescript
// BasePuppeteerScraper.ts - 100 lines of shared code
// AutoTraderScraper.ts - 200 lines of site-specific code
// EbayScraper.ts - 150 lines of site-specific code
// GumtreeScraper.ts - 200 lines of site-specific code
```

### 2. **Maintainability**
Bug fixes and improvements to Puppeteer logic only need to be made in one place.

**Example**: Need to update the user agent for all scrapers?
```typescript
// Change once in BasePuppeteerScraper.createPage()
protected async createPage(): Promise<Page> {
  const page = await this.browser.newPage();
  await page.setUserAgent("NEW_USER_AGENT"); // ✅ Fixed for all scrapers
  return page;
}
```

### 3. **Extensibility**
Adding new scrapers is straightforward - just extend the base class and implement three methods.

```typescript
export class NewSiteScraper extends BasePuppeteerScraper {
  constructor() {
    super('newsite');
  }

  // Implement only 3 methods - everything else is handled by base class
  protected buildSearchUrl(criteria) { /* ... */ }
  protected waitForContent(page) { /* ... */ }
  protected parseHtml(html, criteria, url) { /* ... */ }
}
```

### 4. **Testability**
Each component can be tested independently with proper mocking.

```typescript
describe('AutoTraderScraper', () => {
  it('should build correct URL', () => {
    const scraper = new AutoTraderScraper();
    const url = (scraper as any).buildSearchUrl({ make: 'BMW' });
    expect(url).toContain('make=BMW');
  });
});
```

### 5. **Type Safety**
TypeScript ensures all scrapers implement required methods correctly.

```typescript
// TypeScript will error if you forget to implement required methods
class BrokenScraper extends BasePuppeteerScraper {
  // ❌ Error: must implement abstract methods
}
```

## Backwards Compatibility

The existing functional API is maintained for backwards compatibility:

```typescript
// Old way (still works)
import { searchAutoTrader } from '@/lib/autotrader';
const result = await searchAutoTrader(criteria);

// New way (recommended)
import { AutoTraderScraper } from '@/lib/scrapers';
const scraper = new AutoTraderScraper();
const result = await scraper.search(criteria);
```

## Design Patterns Used

### 1. **Template Method Pattern**
The `search()` method in `BasePuppeteerScraper` defines the skeleton of the algorithm, with subclasses implementing specific steps.

### 2. **Strategy Pattern**
Each scraper implements its own parsing strategy while sharing common infrastructure.

### 3. **Dependency Injection**
Puppeteer and Chromium dependencies are injected and managed by the base class.

## Performance Considerations

### Browser Reuse (Future Enhancement)
Currently, each search creates a new browser instance. Consider pooling for high-throughput scenarios:

```typescript
class ScraperPool {
  private scrapers: Map<string, BasePuppeteerScraper> = new Map();

  async get(site: string): Promise<BasePuppeteerScraper> {
    if (!this.scrapers.has(site)) {
      // Create and cache scraper
    }
    return this.scrapers.get(site)!;
  }
}
```

### Parallel Execution
Multiple scrapers can run in parallel safely:

```typescript
const results = await Promise.all([
  new AutoTraderScraper().search(criteria),
  new EbayScraper().search(criteria),
  new GumtreeScraper().search(criteria)
]);
```

## Error Handling

All scrapers throw `AdapterError` for consistent error handling:

```typescript
try {
  const result = await scraper.search(criteria);
} catch (error) {
  if (error instanceof AdapterError) {
    console.error(`${scraper.siteName} failed:`, error.message);
  }
}
```

## Future Improvements

1. **Browser Pooling**: Reuse browser instances for better performance
2. **Retry Logic**: Automatic retries with exponential backoff
3. **Caching**: Cache results for repeated queries
4. **Rate Limiting**: Prevent overwhelming target sites
5. **Metrics**: Track scraping success rates and performance
6. **Proxy Support**: Rotate IPs to avoid rate limiting

## Contributing

When adding a new scraper:

1. Create a new class extending `BasePuppeteerScraper`
2. Implement the three required abstract methods
3. Add tests for your implementation
4. Update the exports in `index.ts`
5. Add usage examples to this README

