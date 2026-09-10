# Backend + BERT (417M) — for EC2 / App Runner / Lightsail
# Build: docker build -t cfa-backend .
# Run:   docker run -p 80:8000 --env-file .env cfa-backend

FROM python:3.11-slim

# System deps (for pymysql, torch cpu)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency files first (cache layer)
COPY requirements.txt pyproject.toml ./

# Install Python deps (torch CPU ~800M will be downloaded)
RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt \
 && pip install --no-cache-dir -e . --no-deps

# Copy source + trained BERT model (426M)
COPY src ./src
COPY bert_aste_final ./bert_aste_final

# Optional: keep data / renders but not frontend (backend only per request)
# If you need .env at build time, copy .env.example as fallback
COPY .env.example .env.example

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

EXPOSE 8000

# Healthcheck for EC2 / App Runner
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["sh", "-c", "uvicorn cfa.api.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
