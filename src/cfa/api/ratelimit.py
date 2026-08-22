"""Lightweight in-memory rate limiter (per client IP, fixed window).

For a single instance this is enough to stop abuse and accidental floods.
For multi-instance / production scale, back this with Redis.
"""

import time
from collections import defaultdict, deque


class RateLimiter:
    def __init__(self, max_requests: int = 60, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.hits: dict = defaultdict(deque)

    def is_allowed(self, key: str) -> bool:
        now = time.time()
        bucket = self.hits[key]
        while bucket and bucket[0] <= now - self.window_seconds:
            bucket.popleft()
        if len(bucket) >= self.max_requests:
            return False
        bucket.append(now)
        return True
