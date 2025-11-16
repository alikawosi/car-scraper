"""RQ worker entrypoint for processing scraping jobs."""
from __future__ import annotations

import logging
import os

from rq import Connection, Worker

from app.background import get_redis_connection

LOGGER = logging.getLogger(__name__)


def main() -> None:
    """Start an RQ worker listening on the configured queue."""

    connection = get_redis_connection()
    if connection is None:
        raise RuntimeError("Redis must be available to run the worker")

    queue_name = os.getenv("RQ_QUEUE_NAME", "car-scraper")
    with Connection(connection):
        worker = Worker([queue_name])
        LOGGER.info("Starting worker for queue '%s'", queue_name)
        worker.work(with_scheduler=True)


if __name__ == "__main__":  # pragma: no cover - manual execution
    main()
