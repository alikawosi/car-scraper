# Car Search & Valuation Backend – Technical Specification

This document describes the architecture and requirements for a **Python backend service** that:

1. Accepts a car search request via HTTP (e.g. from Postman or a frontend).
2. Scrapes one or more listing websites using **site adapters**.
3. Extracts **number plates** from listing images using an OpenAI **vision** model.
4. Calls an OpenAI **text** model to **value each car** (fair price + range).
5. Returns the results via an HTTP endpoint, grouped under a **job ID**.

The service is designed to be:

- **Modular** – easy to add more websites.
- **Testable** – works end‑to‑end from Postman.
- **Extendable** – can be upgraded later to use background workers, Redis, etc.

> Initial goal: a single-process version that runs synchronously, good enough to validate flow and endpoints.
> Future goal: move heavy work into background workers/queues for scalability.

---

## 1. Tech Stack

- **Language:** Python 3.10+
- **Web framework:** FastAPI
- **Web server (local dev):** uvicorn
- **HTTP client:** `requests`
- **HTML parsing:** `beautifulsoup4`
- **Config:** `python-dotenv` for `.env`
- **OpenAI:** `openai` Python SDK (Responses API & Vision)
- **Data validation / schema:** Pydantic (via FastAPI models)

### 1.1. Project structure

Target structure in the repo:

```txt
car_pipeline/
  app/
    __init__.py
    main.py          # FastAPI app & endpoints
    models.py        # Pydantic models (request/response + domain types)
    pipeline.py      # Scraping + plate OCR + valuation logic
    adapters/
      __init__.py    # registry of site adapters
      base.py        # SiteAdapter protocol/interface
      autotrader.py  # example implementation for AutoTrader
  docs/
    backend-car-pipeline.md  # this document
  requirements.txt
  .env.example
```

---

## 2. Environment & Dependencies

### 2.1. `requirements.txt`

The backend should at least include:

```txt
fastapi
uvicorn[standard]
requests
pydantic
python-dotenv
openai
beautifulsoup4
```

(Extra packages like `typing-extensions` may be added automatically by tools.)

### 2.2. Environment variables

Use a `.env` file (loaded by `python-dotenv`) with at least:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

- Provide `.env.example` in the repo.
- Ensure `.env` is **ignored** by git (`.gitignore`).

The OpenAI client should be initialised in `pipeline.py` as:

```python
from openai import OpenAI
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
```

### 2.3. Background job queue

Heavy scraping and valuation work now runs in the background via **Redis + RQ**:

- Configure Redis via `REDIS_URL` (or `RQ_REDIS_URL`) or `REDIS_HOST`/`REDIS_PORT` env vars.
- Jobs are queued on `RQ_QUEUE_NAME` (defaults to `car-scraper`).
- Run a worker locally with `python -m app.worker` once Redis is available.
- If Redis is unreachable, the API falls back to synchronous execution so the developer
  experience remains smooth.

---

## 3. HTTP API

The backend exposes two main endpoints:

1. `POST /search/start` – start a search job.
2. `GET /search/{job_id}/results` – retrieve valued cars for a job.

### 3.1. `POST /search/start`

**Purpose:** Accept a search model from the client (e.g. Postman) and start the pipeline.

- **Method:** `POST`
- **Path:** `/search/start`
- **Request body:** JSON with:
  - `criteria` – generic search criteria (make, model, ranges, etc.)
  - `websites` – list of site IDs to search (e.g. `["autotrader", "ebay"]`)

#### Request body schema (Pydantic: `SearchRequestBody`)

```python
class SearchCriteria(BaseModel):
    make: str
    model: str
    yearMin: Optional[int] = None
    yearMax: Optional[int] = None
    priceMin: Optional[float] = None
    priceMax: Optional[float] = None
    maxMileage: Optional[int] = None
    postcode: Optional[str] = None
    radiusMiles: Optional[int] = None
    resultsPerSite: int = 20


class SearchRequestBody(BaseModel):
    criteria: SearchCriteria
    websites: List[str] = Field(
        ...,
        example=["autotrader", "ebay"],
        description="List of site IDs, e.g. ['autotrader', 'ebay']"
    )
```

#### Response schema (Pydantic: `JobStatusResponse`)

```python
class JobStatusResponse(BaseModel):
    job_id: str
    status: Literal["started", "unknown"]
```

**Behaviour (for the initial version):**

- Validate `websites` is non-empty.
- Call `start_job(criteria, websites)` from `pipeline.py`.
- `start_job` will:
  - Generate a `job_id`.
  - Run the entire job synchronously (scrape → OCR → valuation).
  - Store results in a global in-memory dict `JOBS[job_id]`.
- Return `{ "job_id": ..., "status": "started" }`.

> Later, `start_job` can be changed to queue a background job; the endpoint contract stays the same.

Example body for Postman:

```json
{
  "criteria": {
    "make": "BMW",
    "model": "3 Series",
    "yearMin": 2017,
    "yearMax": 2020,
    "priceMin": 8000,
    "priceMax": 16000,
    "maxMileage": 90000,
    "postcode": "W7 3FT",
    "radiusMiles": 150,
    "resultsPerSite": 3
  },
  "websites": ["autotrader", "ebay"]
}
```

### 3.2. `GET /search/{job_id}/results`

**Purpose:** Retrieve all valued cars for a given job.

- **Method:** `GET`
- **Path:** `/search/{job_id}/results`
- **Path parameter:** `job_id` – the ID returned by `/search/start`.

#### Response schema (Pydantic: `ResultsResponse`)

```python
class EstimatedValue(BaseModel):
    fair_price: float
    range_low: float
    range_high: float
    confidence: Literal["low", "medium", "high"]
    notes: Optional[str] = None


class RawCar(BaseModel):
    source: str
    external_id: str
    title: str
    url: str
    year: Optional[int] = None
    mileage: Optional[int] = None
    price: Optional[float] = None
    location: Optional[str] = None
    fuel: Optional[str] = None
    gearbox: Optional[str] = None
    body_type: Optional[str] = None
    images: List[str] = []
    plate: Optional[str] = None


class ValuedCar(RawCar):
    estimated_value: EstimatedValue


class ResultsResponse(BaseModel):
    job_id: str
    cars: List[ValuedCar]
```

**Behaviour:**

- Look up `JOBS[job_id]` (a list of `ValuedCar`).
- If the job does not exist, return 404.
- Return JSON `{ "job_id": "...", "cars": [ ... ] }`.

> In this first version, since job execution is synchronous, by the time you get the `job_id`, results should be ready. Later, this can become a “polling” endpoint when jobs are backgrounded.

---

## 4. Adapters & Sites

Different websites require different URL formats and HTML parsing. To keep this scalable, we define a **SiteAdapter** interface and register available adapters.

### 4.1. `SiteAdapter` interface

Defined in `app/adapters/base.py`:

```python
from typing import List, Protocol
from app.models import SearchCriteria, SearchRequest, RawCar


class SiteAdapter(Protocol):
    id: str
    display_name: str

    def build_search_requests(self, criteria: SearchCriteria) -> List[SearchRequest]:
        """
        Given generic search criteria, build one or more HTTP search requests
        (for pagination or multiple pages).
        """
        ...

    def parse_results(self, response_body: str, req: SearchRequest) -> List[RawCar]:
        """
        Given the raw HTML (or body) for a specific search request, parse it into
        a list of RawCar objects.
        """
        ...
```

### 4.2. `SearchRequest` model

In `app/models.py`:

```python
class SearchRequest(BaseModel):
    url: str
    method: Literal["GET", "POST"] = "GET"
    body: Optional[dict] = None
    headers: Optional[dict] = None
    page: Optional[int] = None
```

### 4.3. Example: AutoTrader adapter

In `app/adapters/autotrader.py` we implement `AutoTraderAdapter` as a `SiteAdapter`.

Key responsibilities:

1. **`build_search_requests(criteria)`**

   - Use `urllib.parse.urlencode` to build a **GET URL** for AutoTrader based on `SearchCriteria`.
   - Set sensible defaults for missing `postcode` / `radiusMiles`.
   - Return a list with at least one `SearchRequest` (for now, only page 1).

2. **`parse_results(response_body, req)`**
   - Use `BeautifulSoup` to parse HTML.
   - Extract data per listing (template, OK to use placeholder selectors with TODO comments):
     - `title` (e.g. `<h2>` or title container)
     - `price` (text → numeric)
     - `url` (relative link → absolute `https://www.autotrader.co.uk/...`)
     - `image` URL (main listing image, if available)
     - Optionally: `year`, `mileage` (parsed from title/specs)
   - Return a list of `RawCar` objects.

**Note:** auto-generated selectors will need to be updated manually to match the real AutoTrader DOM. Keep them simple and add `# TODO` comments.

### 4.4. Example: eBay adapter

`app/adapters/ebay.py` mirrors the AutoTrader implementation but targets the public eBay Motors search page.

- Build a query string for `_nkw` (keywords) plus `_udlo`/`_udhi` for price filters.
- Parse listing cards via selectors such as `li.s-item`, `.s-item__title`, `.s-item__price`, and `.s-item__image-img`.
- Extract a `ScrapedCar` with price, mileage (if present in the dynamic specs block), inferred location, and the image URL from either `src` or `data-src`.

Adding this adapter means the API can now handle `websites` arrays that include `"ebay"`.

### 4.5. Adapters registry

The pipeline keeps a lightweight registry of adapters in `app/pipeline.py`:

```python
from app.adapters.autotrader import AutoTraderAdapter
from app.adapters.ebay import EbayAdapter

ADAPTER_FACTORIES = {
    "autotrader": AutoTraderAdapter,
    "ebay": EbayAdapter,
}

def _get_adapter(site_id: str) -> BaseAdapter | SimpleSiteAdapter:
    site_id = site_id.lower()
    adapter = ADAPTERS.get(site_id)
    if adapter:
        return adapter

    factory = ADAPTER_FACTORIES.get(site_id)
    adapter = factory() if factory else SimpleSiteAdapter(site_id)
    ADAPTERS[site_id] = adapter
    return adapter
```

`run_job` calls `_get_adapter(site_id)` for every requested website, ensuring we reuse concrete adapters when available and fall back to `SimpleSiteAdapter` for demo-only sites.

---

## 5. Pipeline Logic

Core functions live in `app/pipeline.py`:

- `start_job(criteria: SearchCriteria, websites: List[str]) -> str`
- `run_job(job_id: str, criteria: SearchCriteria, websites: List[str]) -> None`
- `enrich_with_plate(car: RawCar) -> RawCar`
- `value_car(car: RawCar) -> ValuedCar`

An in-memory dict `JOBS: Dict[str, List[ValuedCar]]` is used for demo purposes.

### 5.1. Job lifecycle

1. **start_job**

   - Generate `job_id` (UUID).
   - Initialise `JOBS[job_id] = []`.
   - Call `run_job(job_id, criteria, websites)` synchronously.
   - Return `job_id`.

2. **run_job**
   - For each `site_id` in `websites`:
     - Get adapter via `get_adapter(site_id)`.
     - `requests_list = adapter.build_search_requests(criteria)`.
     - For each `SearchRequest req`:
       - Perform HTTP request with `requests.request(method=req.method, url=req.url, ...)`.
       - `resp.raise_for_status()` for errors.
       - `cars = adapter.parse_results(resp.text, req)`.
       - Append up to `criteria.resultsPerSite` `RawCar` objects to a global `all_cars` list.
   - For each `RawCar` in `all_cars`:
     - Call `enrich_with_plate(car)` → returns `RawCar` with `plate` if image exists.
     - Call `value_car(car_with_plate)` → returns `ValuedCar`.
     - Append the `ValuedCar` to `JOBS[job_id]`.

> IMPORTANT: In this first version `run_job` is synchronous and blocks until all cars are processed. This is OK for using Postman and verifying correctness. Later, it can be moved into a background worker.

### 5.2. Plate extraction with OpenAI Vision

Function: `enrich_with_plate(car: RawCar) -> RawCar`.

Behaviour:

- If `car.images` is empty, return the car as-is.
- Otherwise:
  - Take the first image URL, `image_url = car.images[0]`.
  - Call `client.responses.create` with:
    - `model="gpt-4.1-mini"` (or other capable vision model)
    - Input containing:
      - A text instruction: “Read the vehicle registration plate clearly. Reply with ONLY the plate text, nothing else.”
      - The image URL as `input_image`.
  - Parse `response.output_text` as the plate string (strip whitespace).
  - Set `car.plate = plate` and return the car.

Example call (pseudo-structure):

```python
response = client.responses.create(
    model="gpt-4.1-mini",
    input=[
        {
            "role": "user",
            "content": [
                {
                    "type": "input_text",
                    "text": (
                        "Read the vehicle registration plate clearly. "
                        "Reply with ONLY the plate text, nothing else."
                    ),
                },
                {
                    "type": "input_image",
                    "image_url": image_url,
                },
            ],
        }
    ],
)
plate = response.output_text.strip()
car.plate = plate
```

### 5.3. Car valuation with OpenAI

Function: `value_car(car: RawCar) -> ValuedCar`.

Behaviour:

- Convert `car` to a basic dict using `car.model_dump()`.
- Build a concise prompt:
  - Instruct the model that it is a **UK used-car valuation engine**.
  - It gets car data including plate, mileage, price, year, source, etc.
  - It must return **only JSON** with keys:
    - `fair_price` (float)
    - `range_low` (float)
    - `range_high` (float)
    - `confidence` ("low" | "medium" | "high")
    - `notes` (string)
- Call `client.responses.create` with:
  - `model="gpt-4.1-mini"` (or similar)
  - `input=prompt`
  - `response_format={"type": "json_object"}`
- Parse the JSON from `response.output_text` to a dict (`val_data`).
- Construct an `EstimatedValue` and then a `ValuedCar`.

Example:

```python
car_data = car.model_dump()

prompt = (
    "You are a UK used-car valuation engine. "
    "Given this car data (including plate and mileage), estimate a fair price.
"
    "Return ONLY JSON with keys: fair_price, range_low, range_high, confidence, notes.

"
    f"Car data:
{json.dumps(car_data)}"
)

response = client.responses.create(
    model="gpt-4.1-mini",
    input=prompt,
    response_format={"type": "json_object"},
)

json_str = response.output_text
val_data = json.loads(json_str)

estimated_value = {
    "fair_price": float(val_data["fair_price"]),
    "range_low": float(val_data["range_low"]),
    "range_high": float(val_data["range_high"]),
    "confidence": val_data.get("confidence", "medium"),
    "notes": val_data.get("notes", ""),
}
```

The final returned `ValuedCar`:

```python
return ValuedCar(**{**car.model_dump(), "estimated_value": estimated_value})
```

---

## 6. FastAPI App (`app/main.py`)

`app/main.py` must:

1. Create a FastAPI instance.
2. Add CORS middleware (for local testing we can allow all origins).
3. Expose the two endpoints described in section 3.

Skeleton:

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.models import (
    SearchRequestBody,
    JobStatusResponse,
    ResultsResponse,
)
from app.pipeline import start_job, JOBS


app = FastAPI(title="Car Search & Valuation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/search/start", response_model=JobStatusResponse)
def start_search(body: SearchRequestBody):
    if not body.websites:
        raise HTTPException(status_code=400, detail="websites cannot be empty")

    job_id = start_job(body.criteria, body.websites)
    return JobStatusResponse(job_id=job_id, status="started")


@app.get("/search/{job_id}/results", response_model=ResultsResponse)
def get_results(job_id: str):
    cars = JOBS.get(job_id)
    if cars is None:
        raise HTTPException(status_code=404, detail="Job not found")

    return ResultsResponse(job_id=job_id, cars=cars)
```

Run locally:

```bash
uvicorn app.main:app --reload --port 8000
```

Test with Postman by calling:

1. `POST http://localhost:8000/search/start` – with JSON body (see 3.1).
2. `GET http://localhost:8000/search/<job_id>/results` – with job ID returned in step 1.

---

## 7. Future Extensions (for later, not required now)

These improvements are not required for the initial implementation, but the code should be structured so they are easy to add later:

1. **Background jobs / queues**

   - Move `run_job` to a queue worker (e.g. Redis + RQ or Celery).
   - `/search/start` only enqueues the job and returns `job_id` immediately.
   - `/search/{job_id}/results` becomes a polling endpoint while the job runs.

2. **Persistent storage**

   - Replace the in-memory `JOBS` dict with a real DB (PostgreSQL / Supabase).
   - Tables:
     - `jobs(job_id, created_at, status, criteria_json, websites_json, ...)`
     - `cars(id, job_id, source, external_id, title, url, price, year, mileage, plate, estimated_value_json, ...)`

3. **More websites**

   - Add additional adapters (eBay, Gumtree, etc.) implementing the same `SiteAdapter` interface.
   - No need to change the pipeline; just register new adapters in `app/adapters/__init__.py`.

4. **Better DOM parsing**

   - Use site-specific selectors and robust parsing for year, mileage, location, etc.
   - Handle pagination by adding more `SearchRequest` objects per site.

5. **Deal scoring**

   - Compute fields like `deal_delta = car.price - estimated_value.fair_price`.
   - Sort results by best deal (lowest price vs fair price).

6. **Rate limiting & security**
   - Add rate limiting at HTTP layer.
   - Validate that only **whitelisted domains** are used inside adapters.
   - Tighten CORS configuration.

---

## 8. Implementation Notes for Codex / Code Generation

- Follow the structure and type definitions from this document.
- Focus on making the project **runnable locally** with:
  - `pip install -r requirements.txt`
  - `uvicorn app.main:app --reload --port 8000`
- Do not overcomplicate:
  - Single-process; no background workers yet.
  - In-memory `JOBS` dict is acceptable.
- Add TODO comments in the AutoTrader adapter where actual DOM selectors need to be refined manually.
- Make sure all imports are consistent (`from app.models import ...`, `from app.adapters import get_adapter`, etc.).
