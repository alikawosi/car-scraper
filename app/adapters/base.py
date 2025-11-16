"""Shared dataclasses and base infrastructure for site adapters."""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
import logging
from typing import List, Optional

import requests
from bs4 import BeautifulSoup, Tag

from app.models import Listing, SearchCriteria

LOGGER = logging.getLogger(__name__)


class AdapterError(RuntimeError):
    """Raised when a site adapter cannot complete its work."""


@dataclass(slots=True)
class ScrapedCar:
    """Lightweight container describing a scraped vehicle listing."""

    listing_id: str
    website: str
    title: str
    price: float
    mileage_km: Optional[int]
    location: Optional[str]
    images: List[str] = field(default_factory=list)

    def to_listing(self, valuation: Optional[float]) -> Listing:
        """Convert to the API ``Listing`` model with valuation info attached."""

        return Listing(
            listing_id=self.listing_id,
            website=self.website,
            title=self.title,
            price=self.price,
            mileage_km=self.mileage_km,
            location=self.location,
            valuation=valuation,
        )


class BaseAdapter(ABC):
    """Base class providing plumbing for concrete scraping adapters."""

    DEFAULT_TIMEOUT = 15

    def __init__(
        self,
        site_name: str,
        base_url: str,
        *,
        session: Optional[requests.Session] = None,
    ) -> None:
        self.site_name = site_name
        self.base_url = base_url.rstrip("/")
        self.session = session or requests.Session()

    def scrape(self, criteria: SearchCriteria) -> List[ScrapedCar]:
        """Fetch and parse listings for the provided criteria."""

        url = self.build_search_url(criteria)
        html = self.fetch(url)
        return self.parse_listings(html, criteria)

    def fetch(self, url: str) -> str:
        """Fetch ``url`` and return the response body."""

        LOGGER.debug("Fetching %s listings from %s", self.site_name, url)
        try:
            response = self.session.get(url, timeout=self.DEFAULT_TIMEOUT)
            response.raise_for_status()
            return response.text
        except requests.RequestException as exc:  # pragma: no cover - network
            raise AdapterError(f"Failed to fetch data from {self.site_name}: {exc}") from exc

    def parse_listings(self, html: str, criteria: SearchCriteria) -> List[ScrapedCar]:
        """Parse the provided HTML into ``ScrapedCar`` objects."""

        soup = self._build_soup(html)
        return self._parse_soup(soup, criteria)

    def _build_soup(self, html: str) -> BeautifulSoup:
        return BeautifulSoup(html, "html.parser")

    @abstractmethod
    def build_search_url(self, criteria: SearchCriteria) -> str:
        """Return the URL that should be fetched for ``criteria``."""

    @abstractmethod
    def _parse_soup(self, soup: BeautifulSoup, criteria: SearchCriteria) -> List[ScrapedCar]:
        """Parse a ``BeautifulSoup`` instance into ``ScrapedCar`` entries."""

    @staticmethod
    def _text(element: Optional[Tag]) -> str:
        """Return cleaned text content from a BeautifulSoup node."""

        if element is None:
            return ""
        return " ".join(element.get_text(strip=True).split())

    @staticmethod
    def _parse_int(value: str) -> Optional[int]:
        digits = "".join(ch for ch in value if ch.isdigit())
        return int(digits) if digits else None

    @staticmethod
    def _parse_price(value: str) -> Optional[float]:
        digits = "".join(ch for ch in value if ch.isdigit() or ch == ".")
        return float(digits) if digits else None


__all__ = ["AdapterError", "BaseAdapter", "ScrapedCar"]
