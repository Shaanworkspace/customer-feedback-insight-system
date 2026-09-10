"""Rate limiter — stops too many requests.

Simple words:
- Each IP (each computer) can make at most 30 requests in 60 seconds.
- If many different IPs together make too many requests (global flood), we also block (200 in 60 seconds).
- For one server this in-memory check is enough. For many servers, use Redis.

How it works (like a ticket window):
- We keep a list of times when each IP asked.
- When a new request comes, we throw away times older than 60 seconds.
- If 30 or more times are left, we say "too many, wait".
- Else we add the current time and say "ok".

This file is separate so it is easy to find and easy to read.
"""

import time
from collections import defaultdict, deque


class RateLimiter:
    def __init__(self, max_requests: int = 30, window_seconds: int = 60, global_max: int = 200):
        # How many requests one IP can make in the window
        self.max_requests_per_ip = max_requests
        # How long is the window (seconds)
        self.window_seconds = window_seconds
        # How many requests all IPs together can make (global flood protection)
        self.global_max_requests = global_max

        # For each IP, keep a queue of request times
        self.requests_by_ip: dict = defaultdict(deque)
        # For all requests together
        self.global_requests: deque = deque()

    def _clean_old_requests(self, request_times: deque, current_time: float):
        # Remove times that are older than the window
        while request_times and request_times[0] <= current_time - self.window_seconds:
            request_times.popleft()

    def is_allowed(self, client_ip: str) -> bool:
        current_time = time.time()

        # Step 1: Clean old times for this IP
        ip_requests = self.requests_by_ip[client_ip]
        self._clean_old_requests(ip_requests, current_time)

        # Step 2: Clean old times for global
        self._clean_old_requests(self.global_requests, current_time)

        # Step 3: Check if this IP has too many
        if len(ip_requests) >= self.max_requests_per_ip:
            return False

        # Step 4: Check if all IPs together have too many (global flood)
        if len(self.global_requests) >= self.global_max_requests:
            return False

        # Step 5: Allow and remember this request
        ip_requests.append(current_time)
        self.global_requests.append(current_time)
        return True

    def get_remaining(self, client_ip: str) -> int:
        # How many requests this IP can still make (for headers, not used now)
        current_time = time.time()
        self._clean_old_requests(self.requests_by_ip[client_ip], current_time)
        return max(0, self.max_requests_per_ip - len(self.requests_by_ip[client_ip]))
