"""Simplified scraping/valuation pipeline used by the API."""
from __future__ import annotations

from typing import Dict, List
from uuid import uuid4

from app.models import JobStatus, Listing, ResultsResponse, SearchCriteria

# In-memory store that keeps the latest job results.  In a real system this would
# be persisted in a database or cache.
_JOBS: Dict[str, ResultsResponse] = {}


def start_job(criteria: SearchCriteria, websites: List[str]) -> str:
    """Create a new job and immediately populate mocked results.

    The implementation is intentionally synchronous to keep the exercise focused
    on the FastAPI surface.  It generates deterministic placeholder listings so
    tests can assert on a predictable structure without depending on external
    services.
    """

    job_id = str(uuid4())
    listings = []
    active_sites = websites or ["generic"]

    for idx, site in enumerate(active_sites, start=1):
        title_bits = [criteria.make or "Car", criteria.model or "Listing"]
        title = " ".join(bit for bit in title_bits if bit)
        price = float(20000 + idx * 1500)
        valuation = price * 1.05
        listing = Listing(
            listing_id=f"{job_id}-{idx}",
            website=site,
            title=title,
            price=price,
            mileage_km=50000 - idx * 1000,
            location=criteria.location,
            valuation=round(valuation, 2),
        )
        listings.append(listing)

    _JOBS[job_id] = ResultsResponse(
        job_id=job_id,
        status=JobStatus.COMPLETED,
        results=listings,
    )
    return job_id


def get_job_results(job_id: str) -> ResultsResponse:
    """Return previously stored job results.

    Raises a ``KeyError`` if the job identifier is unknown to mimic what a real
    persistence layer would do when the job has not been created.
    """

    if job_id not in _JOBS:
        raise KeyError(f"Job '{job_id}' not found")
    return _JOBS[job_id]


__all__ = ["start_job", "get_job_results"]
