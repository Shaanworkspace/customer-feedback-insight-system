# Backend — CPU-only for t3.small x86_64, model mounted from EC2 host (not in image)
# Build: docker build -t customer-sentiment-analysis:latest .  (no model in context)
# Run:   docker run -p 8000:8000 --env-file .env -v /opt/customer-sentiment-analysis/model:/app/bert_aste_final:ro customer-sentiment-analysis:latest

FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/src \
    PORT=8000

# System deps (psycopg for future, build-essential for some wheels)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
 && rm -rf /var/lib/apt/lists/*

# Copy dependency file first for layer cache
COPY requirements.txt ./

# Install CPU-only PyTorch first (avoid CUDA bloat: 3GB+ nvidia/*)
# Then install remaining requirements WITHOUT reinstalling torch (single torch install)
RUN pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu torch \
 && grep -v "^torch" requirements.txt > /tmp/req_no_torch.txt \
 && pip install --no-cache-dir -r /tmp/req_no_torch.txt \
 && rm /tmp/req_no_torch.txt

# Copy app source only — model is NOT in image (mounted from EC2 host /opt/customer-sentiment-analysis/model)
COPY src ./src

# Non-secret example env (actual .env never copied)
COPY .env.example .env.example

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "cfa.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
