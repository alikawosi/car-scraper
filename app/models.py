"""Pydantic models for the car search API."""
from __future__ import annotations

from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class JobStatus(str, Enum):
    """Possible states for a scraping/valuation job."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class SearchCriteria(BaseModel):
    """Parameters describing the user's desired vehicle."""

    make: Optional[str] = Field(None, description="Vehicle manufacturer")
    model: Optional[str] = Field(None, description="Vehicle model")
    min_year: Optional[int] = Field(None, ge=1886, description="Minimum model year")
    max_year: Optional[int] = Field(None, ge=1886, description="Maximum model year")
    min_price: Optional[float] = Field(None, ge=0, description="Minimum asking price")
    max_price: Optional[float] = Field(None, ge=0, description="Maximum asking price")
    location: Optional[str] = Field(None, description="Desired purchase location")
    keywords: Optional[List[str]] = Field(
        default=None,
        description="Additional free-text keywords to search for",
    )


class SearchStartRequest(BaseModel):
    """Request body for starting a search job."""

    criteria: SearchCriteria
    websites: List[str] = Field(
        default_factory=list,
        description="List of website identifiers to include in the search",
    )


class StartJobResponse(BaseModel):
    """Response body after a job has been queued."""

    job_id: str


class Listing(BaseModel):
    """Single scraped and valuated car listing."""

    listing_id: str
    website: str
    title: str
    price: float
    currency: str = Field(default="USD")
    mileage_km: Optional[int] = None
    location: Optional[str] = None
    valuation: Optional[float] = None


class ResultsResponse(BaseModel):
    """Aggregated results for a job."""

    job_id: str
    status: JobStatus
    results: List[Listing]

