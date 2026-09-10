"""FastAPI app: wires routers, CORS, rate limiting and error handling."""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from cfa.api.deps import metrics
from cfa.api.ratelimit import RateLimiter
from cfa.api.routers import analyze, auth, data
from cfa.db import init_db

init_db()

app = FastAPI(title="Customer Feedback Insight System")

# Allow 30 requests per IP in 60 seconds, and 200 total for all IPs (global flood)
limiter = RateLimiter(max_requests=30, window_seconds=60, global_max=200)


# Small helper: should we skip rate limiting for this path?
def is_health_check(path: str) -> bool:
    return path in ("/health", "/api/v1/ping")


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Health checks are not limited
    if is_health_check(request.url.path):
        return await call_next(request)

    # Find who is asking (IP address)
    client_ip = request.client.host if request.client else "unknown"

    # Check if this IP (or all IPs together) made too many requests
    if not limiter.is_allowed(client_ip):
        # 429 = Too Many Requests, tell the browser to wait 60 seconds
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests. Please wait a minute and try again."},
            headers={"Retry-After": "60"},
        )

    # OK, let the request continue
    return await call_next(request)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again later."},
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:4173",
        "https://customer-feedback-insight-system.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    avg = metrics["total_latency_ms"] / metrics["reviews_analyzed"] if metrics["reviews_analyzed"] else 0.0
    return {"status": "ok", "reviews_analyzed": metrics["reviews_analyzed"], "avg_latency_ms": round(avg, 2)}


@app.get("/api/v1/ping")
def ping():
    return {"message": "CFA backend is alive"}


app.include_router(auth.router)
app.include_router(analyze.router)
app.include_router(data.router)
