"""Background queue helpers shared by the API and worker processes."""
from __future__ import annotations

import logging
import os
from typing import Optional

from redis import Redis
from rq import Queue

LOGGER = logging.getLogger(__name__)

_QUEUE: Optional[Queue] = None


def get_redis_connection() -> Optional[Redis]:
    """Return a live Redis connection or ``None`` if Redis is unavailable."""

    redis_url = os.getenv("REDIS_URL") or os.getenv("RQ_REDIS_URL")
    host = os.getenv("REDIS_HOST", "localhost")
    port = int(os.getenv("REDIS_PORT", "6379"))
    db = int(os.getenv("REDIS_DB", "0"))

    try:
        if redis_url:
            connection = Redis.from_url(redis_url)
        else:
            connection = Redis(host=host, port=port, db=db)
        connection.ping()
    except Exception as exc:  # pragma: no cover - defensive logging
        LOGGER.warning("Redis connection unavailable: %s", exc)
        return None

    return connection


def get_queue() -> Optional[Queue]:
    """Return a cached RQ queue if Redis is available."""

    global _QUEUE
    if _QUEUE is None:
        connection = get_redis_connection()
        if connection is None:
            return None
        queue_name = os.getenv("RQ_QUEUE_NAME", "car-scraper")
        _QUEUE = Queue(queue_name, connection=connection)
    return _QUEUE


__all__ = ["get_queue", "get_redis_connection"]
