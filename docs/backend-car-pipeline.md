# Backend Car Search & Valuation Pipeline

## Python + FastAPI Backend Specification

This document defines the architecture, endpoints, data models, scraping pipeline, valuation workflow, and extensibility principles for the car search & valuation backend service.

The purpose of this backend is:

1. Accept a **search model** (criteria + websites).
2. For each website:
   - Build the correct URL(s) using a **site adapter**.
   - Scrape the listings (price, mileage, images, year, etc.).
3. Extract **plate numbers** from the car images using OpenAI Vision.
4. Call an OpenAI model to **value each car**.
5. Return all valued cars via API.

This file is the **master specification** for Codex to generate the project.

---

# 1. Technology Stack

- **Python 3.10+**
- **FastAPI** (REST API)
- **Uvicorn** (ASGI server)
- **Requests** (HTTP fetching)
- **BeautifulSoup** (HTML parsing)
- **OpenAI API** (`responses.create` for both image + text)
- **python-dotenv** for environment variables

Initial version is synchronous (simple to test locally).  
Future versions may move scraping & valuation to background workers.

---

# 2. Project Structure

Codex should create the following structure:
