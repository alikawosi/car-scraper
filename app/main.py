"""FastAPI application wiring together request models and the pipeline."""
from __future__ import annotations

from fastapi import FastAPI, HTTPException

from app.models import ResultsResponse, SearchStartRequest, StartJobResponse
from app.pipeline import get_job_results, start_job

app = FastAPI(title="Car Scraper API", version="0.1.0")


@app.post("/search/start", response_model=StartJobResponse)
def start_search(request: SearchStartRequest) -> StartJobResponse:
    """Start the scraping job by delegating to the pipeline layer."""

    job_id = start_job(request.criteria, request.websites)
    return StartJobResponse(job_id=job_id)


@app.get("/search/{job_id}/results", response_model=ResultsResponse)
def get_search_results(job_id: str) -> ResultsResponse:
    """Return stored results for the provided job identifier."""

    try:
        return get_job_results(job_id)
    except KeyError as exc:  # pragma: no cover - simple error translation
        raise HTTPException(status_code=404, detail=str(exc)) from exc


__all__ = ["app"]
