"""Manual test harness for live scraping adapters.

Usage examples:
    python scripts/live_scrape.py --make Honda --model Civic --websites ebay autotrader
"""
from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path
from typing import Dict, List, Type

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.adapters.base import AdapterError, BaseAdapter
from app.adapters.autotrader import AutoTraderAdapter
from app.adapters.ebay import EbayAdapter
from app.models import SearchCriteria

LOGGER = logging.getLogger("live_scrape")

ADAPTERS: Dict[str, Type[BaseAdapter]] = {
    "autotrader": AutoTraderAdapter,
    "ebay": EbayAdapter,
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run live scrape attempts against adapters")
    parser.add_argument("--make", help="Vehicle make", default=None)
    parser.add_argument("--model", help="Vehicle model", default=None)
    parser.add_argument("--min-year", type=int, default=None, help="Minimum model year")
    parser.add_argument("--max-price", type=float, default=None, help="Maximum price filter")
    parser.add_argument(
        "--location",
        default=None,
        help="Location/postcode filter (if the adapter supports it)",
    )
    parser.add_argument(
        "--websites",
        nargs="*",
        default=["autotrader", "ebay"],
        help="List of website identifiers to test",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=3,
        help="Number of sample listings to print for each successful adapter",
    )
    return parser.parse_args()


def run_live_scrape(websites: List[str], criteria: SearchCriteria, sample_limit: int) -> None:
    for site in websites:
        site_key = site.lower()
        factory = ADAPTERS.get(site_key)
        if factory is None:
            LOGGER.warning("No adapter registered for '%s'", site)
            continue
        adapter = factory()
        LOGGER.info("Fetching listings from %s using %s", site_key, adapter.build_search_url(criteria))
        try:
            listings = adapter.scrape(criteria)
        except AdapterError as exc:
            LOGGER.error("%s adapter failed: %s", site_key, exc)
            continue

        if not listings:
            LOGGER.warning("%s adapter returned no listings", site_key)
            continue

        LOGGER.info("%s adapter returned %d listings", site_key, len(listings))
        for listing in listings[:sample_limit]:
            LOGGER.info(
                "- %s | $%s | %s",
                listing.title,
                listing.price,
                listing.location,
            )


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(name)s:%(message)s")
    args = parse_args()
    criteria = SearchCriteria(
        make=args.make,
        model=args.model,
        min_year=args.min_year,
        max_price=args.max_price,
        location=args.location,
    )
    run_live_scrape(args.websites, criteria, args.limit)


if __name__ == "__main__":
    main()
