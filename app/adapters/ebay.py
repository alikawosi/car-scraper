"""Adapter implementation for the eBay Motors listings feed."""
from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional
from urllib.parse import urlencode

from bs4 import BeautifulSoup

from app.adapters.base import BaseAdapter, ScrapedCar
from app.models import SearchCriteria


@dataclass(slots=True)
class SelectorConfig:
    """CSS selectors describing the structure of an eBay search result card."""

    listing_container: str = "li.s-item"
    title: str = ".s-item__title"
    price: str = ".s-item__price"
    mileage: str = ".s-item__dynamic"
    location: str = ".s-item__location"
    image: str = ".s-item__image-img"


class EbayAdapter(BaseAdapter):
    """Scrape eBay Motors car listings."""

    SITE_NAME = "ebay"
    BASE_URL = "https://www.ebay.com/sch/Cars-Trucks/6001"

    def __init__(self, *, session=None) -> None:
        super().__init__(self.SITE_NAME, self.BASE_URL, session=session)
        self.selectors = SelectorConfig()

    def build_search_url(self, criteria: SearchCriteria) -> str:
        params: dict[str, str] = {}
        keywords: List[str] = []
        if criteria.make:
            keywords.append(criteria.make)
        if criteria.model:
            keywords.append(criteria.model)
        if criteria.keywords:
            keywords.extend(criteria.keywords)
        if keywords:
            params["_nkw"] = " ".join(keywords)
        if criteria.min_price is not None:
            params["_udlo"] = str(int(criteria.min_price))
        if criteria.max_price is not None:
            params["_udhi"] = str(int(criteria.max_price))
        query = urlencode(params)
        return f"{self.base_url}?{query}" if query else self.base_url

    def _parse_soup(self, soup: BeautifulSoup, criteria: SearchCriteria) -> List[ScrapedCar]:
        listings: List[ScrapedCar] = []
        selector = self.selectors
        for idx, card in enumerate(soup.select(selector.listing_container), start=1):
            title = self._text(card.select_one(selector.title)) or "eBay Listing"
            price_text = self._text(card.select_one(selector.price))
            price = self._parse_price(price_text) or 0.0
            details_block = self._text(card.select_one(selector.mileage))
            mileage = self._parse_int(details_block)
            location_text = self._text(card.select_one(selector.location)) or criteria.location

            image_url: Optional[str] = None
            image_tag = card.select_one(selector.image)
            if image_tag and image_tag.has_attr("src"):
                image_url = image_tag["src"]
            elif image_tag and image_tag.has_attr("data-src"):
                image_url = image_tag["data-src"]

            listing_id = card.get("data-view") or f"ebay-{idx}"

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


__all__ = ["EbayAdapter", "SelectorConfig"]
