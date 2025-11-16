"""Scraping and valuation pipeline that powers the API endpoints."""
from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from typing import Dict, Iterable, List, Optional
from uuid import uuid4

from app.models import JobStatus, Listing, ResultsResponse, SearchCriteria

try:  # pragma: no cover - optional dependency wiring
    from openai import OpenAI
except Exception:  # pragma: no cover - keep importing optional
    OpenAI = None  # type: ignore[assignment]

LOGGER = logging.getLogger(__name__)

# Public store exposed via ``get_job_results``.
JOBS: Dict[str, ResultsResponse] = {}


@dataclass
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


class SimpleSiteAdapter:
    """Fallback site adapter that generates deterministic demo listings."""

    DEFAULT_IMAGE = (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/"
        "License_Plate_with_sample_text.jpg/640px-License_Plate_with_sample_text.jpg"
    )

    def __init__(self, site_name: str) -> None:
        self.site_name = site_name

    def scrape(self, criteria: SearchCriteria) -> List[ScrapedCar]:
        base_title = " ".join(
            bit
            for bit in [criteria.make, criteria.model, "Listing"]
            if bit
        ).strip() or "Used Car"
        location = criteria.location or "Online"
        min_price = criteria.min_price or 10000
        results: List[ScrapedCar] = []

        for idx in range(1, 3):
            price = float(min_price + idx * 2500)
            mileage = max(5000, 80000 - idx * 5000)
            results.append(
                ScrapedCar(
                    listing_id=f"{self.site_name}-{idx}",
                    website=self.site_name,
                    title=f"{base_title} #{idx}",
                    price=round(price, 2),
                    mileage_km=mileage,
                    location=location,
                    images=[self.DEFAULT_IMAGE],
                )
            )
        return results


ADAPTERS: Dict[str, SimpleSiteAdapter] = {}

_OPENAI_CLIENT: Optional["OpenAI"] = None


def _get_openai_client() -> Optional["OpenAI"]:
    """Instantiate the OpenAI client the first time it is needed."""

    global _OPENAI_CLIENT
    if _OPENAI_CLIENT is None and OpenAI is not None:
        try:
            _OPENAI_CLIENT = OpenAI()
        except Exception as exc:  # pragma: no cover - defensive logging
            LOGGER.warning("Unable to create OpenAI client: %s", exc)
    return _OPENAI_CLIENT


def start_job(criteria: SearchCriteria, websites: Optional[List[str]]) -> str:
    """Create a new job entry and synchronously execute the scraping pipeline."""

    job_id = str(uuid4())
    JOBS[job_id] = ResultsResponse(job_id=job_id, status=JobStatus.PENDING, results=[])
    run_job(job_id, criteria, websites)
    return job_id


def run_job(
    job_id: str, criteria: SearchCriteria, websites: Optional[Iterable[str]] = None
) -> None:
    """Execute the scraping + valuation workflow for a given job."""

    if job_id not in JOBS:
        JOBS[job_id] = ResultsResponse(job_id=job_id, status=JobStatus.PENDING, results=[])

    JOBS[job_id] = ResultsResponse(job_id=job_id, status=JobStatus.RUNNING, results=[])

    results: List[Listing] = []
    sites = list(websites or []) or ["generic"]
    for site in sites:
        adapter = ADAPTERS.setdefault(site, SimpleSiteAdapter(site))
        try:
            scraped_cars = adapter.scrape(criteria)
        except Exception as exc:
            LOGGER.exception("Adapter %s failed: %s", site, exc)
            continue

        for car in scraped_cars:
            plate = _read_plate_from_image(car.images)
            valuation = _value_car(car, plate)
            listing = car.to_listing(valuation.get("fair_price"))
            listing.title = f"{listing.title} (Plate: {plate})"
            results.append(listing)

    JOBS[job_id] = ResultsResponse(job_id=job_id, status=JobStatus.COMPLETED, results=results)


def get_job_results(job_id: str) -> ResultsResponse:
    """Return previously stored job results."""

    if job_id not in JOBS:
        raise KeyError(f"Job '{job_id}' not found")
    return JOBS[job_id]


def _read_plate_from_image(images: List[str]) -> str:
    """Read the plate number from the first available image using OpenAI vision."""

    if not images:
        return "UNKNOWN"

    image_url = images[0]
    client = _get_openai_client()
    if client is None:
        return "UNKNOWN"

    try:
        response = client.responses.create(
            model="gpt-4.1-mini",
            input=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": "Extract only the license plate number from this car photo.",
                        },
                        {"type": "input_image", "image_url": {"url": image_url}},
                    ],
                }
            ],
        )
        text = _extract_text_from_response(response)
        return text.strip().replace("\n", " ") or "UNKNOWN"
    except Exception as exc:  # pragma: no cover - network failures
        LOGGER.warning("Vision model failed to read plate: %s", exc)
        return "UNKNOWN"


def _value_car(car: ScrapedCar, plate: str) -> Dict[str, float | str]:
    """Call OpenAI to value the car and return a structured payload."""

    payload = {
        "fair_price": round(car.price * 0.98, 2),
        "range_low": round(car.price * 0.9, 2),
        "range_high": round(car.price * 1.05, 2),
        "confidence": 0.35,
        "notes": "Heuristic fallback valuation.",
    }

    client = _get_openai_client()
    if client is None:
        return payload

    schema = {
        "type": "json_schema",
        "json_schema": {
            "name": "valuation",
            "schema": {
                "type": "object",
                "properties": {
                    "fair_price": {"type": "number"},
                    "range_low": {"type": "number"},
                    "range_high": {"type": "number"},
                    "confidence": {"type": "number"},
                    "notes": {"type": "string"},
                },
                "required": [
                    "fair_price",
                    "range_low",
                    "range_high",
                    "confidence",
                    "notes",
                ],
            },
        },
    }

    description = (
        "You are an expert automotive pricing analyst. Given the scraped listing "
        "details and detected license plate, estimate the fair market price and "
        "a confidence note."
    )
    listing_summary = json.dumps(
        {
            "title": car.title,
            "price": car.price,
            "mileage_km": car.mileage_km,
            "location": car.location,
            "license_plate": plate,
        },
        ensure_ascii=False,
    )

    try:
        response = client.responses.create(
            model="gpt-4.1-mini",
            input=[
                {
                    "role": "system",
                    "content": [{"type": "text", "text": description}],
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                "Return a JSON object with fields fair_price, range_low, "
                                "range_high, confidence, and notes for the following car: "
                                f"{listing_summary}"
                            ),
                        }
                    ],
                },
            ],
            response_format=schema,
        )
        text = _extract_text_from_response(response)
        if text:
            payload = json.loads(text)
    except Exception as exc:  # pragma: no cover - network failures
        LOGGER.warning("Valuation model failed, using heuristic fallback: %s", exc)
    return payload


def _extract_text_from_response(response: object) -> str:
    """Extract free-form text from the OpenAI ``responses`` payload."""

    text_chunks: List[str] = []
    output = getattr(response, "output", None)
    if output is None:
        output = getattr(response, "choices", None)
    if not output:
        return ""

    for item in output:
        contents = getattr(item, "content", None) or []
        for content in contents:
            text = getattr(content, "text", None)
            if isinstance(text, list):
                text_chunks.extend(str(part) for part in text)
            elif isinstance(text, str):
                text_chunks.append(text)
    return "\n".join(chunk for chunk in text_chunks if chunk)


__all__ = ["start_job", "run_job", "get_job_results", "JOBS"]
