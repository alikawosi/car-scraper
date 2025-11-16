"""Adapter implementation for the AutoTrader marketplace."""
from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional
from urllib.parse import urlencode

from bs4 import BeautifulSoup

from app.adapters.base import BaseAdapter, ScrapedCar
from app.models import SearchCriteria


@dataclass(slots=True)
class SelectorConfig:
    """CSS selectors describing the structure of a listing card."""

    # TODO: Replace these selectors with the real AutoTrader markup once confirmed.
    listing_container: str = ".search-results .listing"
    title: str = ".listing-title"
    price: str = ".listing-price"
    mileage: str = ".listing-mileage"
    location: str = ".listing-location"
    image: str = "img"


class AutoTraderAdapter(BaseAdapter):
    """Scrape search results from autotrader.co.uk."""

    SITE_NAME = "autotrader"
    BASE_URL = "https://www.autotrader.co.uk/car-search"

    def __init__(self, *, session=None) -> None:
        super().__init__(self.SITE_NAME, self.BASE_URL, session=session)
        self.selectors = SelectorConfig()

    def build_search_url(self, criteria: SearchCriteria) -> str:
        params: dict[str, str] = {}
        if criteria.make:
            params["makeCodeList"] = criteria.make
        if criteria.model:
            params["modelCodeList"] = criteria.model
        if criteria.min_year:
            params["startYear"] = str(criteria.min_year)
        if criteria.max_year:
            params["endYear"] = str(criteria.max_year)
        if criteria.min_price:
            params["minPrice"] = str(int(criteria.min_price))
        if criteria.max_price:
            params["maxPrice"] = str(int(criteria.max_price))
        if criteria.location:
            params["zip"] = criteria.location
        if criteria.keywords:
            params["keywordPhrases"] = " ".join(criteria.keywords)

        query = urlencode(params)
        return f"{self.base_url}?{query}" if query else self.base_url

    def _parse_soup(self, soup: BeautifulSoup, criteria: SearchCriteria) -> List[ScrapedCar]:
        listings: List[ScrapedCar] = []
        selector = self.selectors
        for idx, card in enumerate(soup.select(selector.listing_container), start=1):
            title = self._text(card.select_one(selector.title)) or "AutoTrader Listing"
            price_text = self._text(card.select_one(selector.price))
            price = self._parse_price(price_text) or 0.0
            mileage_text = self._text(card.select_one(selector.mileage))
            mileage = self._parse_int(mileage_text)
            location_text = self._text(card.select_one(selector.location)) or criteria.location

            image_url: Optional[str] = None
            image = card.select_one(selector.image)
            if image and image.has_attr("src"):
                image_url = image["src"]

            listing_id = card.get("data-listingid") or f"autotrader-{idx}"

            listings.append(
                ScrapedCar(
                    listing_id=listing_id,
                    website=self.site_name,
                    title=title,
                    price=price,
                    mileage_km=mileage,
                    location=location_text,
                    images=[image_url] if image_url else [],
                )
            )

        return listings


__all__ = ["AutoTraderAdapter", "SelectorConfig"]
