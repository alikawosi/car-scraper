## AutoTrader live scraper (Next.js)

This app replaces the original FastAPI prototype with a single Next.js stack that:

- Builds the official AutoTrader, eBay Motors, and Gumtree query URLs from the form input.
- Launches a stealth-enabled Puppeteer browser to let the React-driven experiences render.
- Extracts cards, price, mileage, photos, etc. directly from the hydrated DOM.
- Reads number plates and produces valuations with OpenAI Responses.
- Streams everything to a responsive UI so you can tweak the search live.

> **Heads up**: AutoTrader requires a modern Node runtime. Use Node **20.9+** locally to avoid
> engine warnings from Next 16, Puppeteer and ESLint.

## Prerequisites

- Node.js 20.9 or newer
- npm 10+
- `OPENAI_API_KEY` with vision + JSON Responses access (optional but recommended)

### Environment variables

Create `web/.env.local`:

```env
OPENAI_API_KEY=sk-...
# Optional: run Chromium with a visible window for debugging
AUTOTRADER_HEADLESS=false
```

## Local development

```bash
cd web
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) and submit the search form. The API route
(`/api/search`) invokes the JavaScript scraping pipeline on demand—no background workers required.
All three marketplaces are queried sequentially and merged into one result set.

## Production notes

- Puppeteer spins up Chromium on every request. Deploy to a Node runtime (Vercel, self-hosted, etc.)
  that allows non-sandboxed Chrome processes or provide a custom executable path.
- AutoTrader uses Cloudflare. The `puppeteer-extra-plugin-stealth` setup included here prevents
  immediate blocking, but high volume scraping will still need rotating IPs and rate limiting.
- The valuation + plate reading steps degrade gracefully when `OPENAI_API_KEY` is not configured.

## Project structure

```
src/
  app/                # UI + API route
  lib/
    autotrader.ts     # URL builder + Puppeteer scraping
    ebay.ts           # HTML fetch + cheerio parsing
    gumtree.ts        # HTML fetch + cheerio parsing
    openai.ts         # Shared OpenAI helpers
    pipeline.ts       # Scrape -> enrich orchestration
    schema.ts         # Zod validation
    types.ts          # Domain models
```
