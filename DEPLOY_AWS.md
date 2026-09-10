# Deploy Backend + BERT (417M) to AWS — Easiest Way

> You asked: only backend + ML, easiest. Lambda will NOT work (250 MB limit, your `model.safetensors` is 415M). Use one of these 3. **Easiest is Option A: EC2 + Docker (5 commands).**

## Why Lambda NO?

| Limit | You | Result |
|-------|-----|--------|
| Lambda zip 50 MB, unzipped 250 MB, /tmp 512 MB | model 417M + torch 800M = ~1.3 GB | ❌ Too big |
| Lambda timeout 15 min, cold start 5s | BERT load 1.5s + 15s+ for 52 rows | ❌ Hangs |
| Lambda has no GPU | BERT CPU ok but slow | ⚠️ Slow |

**So skip Lambda. Use EC2 / App Runner / Lightsail — they take 400M+ easily.**

---

## Option A: EC2 + Docker (EASIEST, 10 min, ~$12/mo) ⭐ RECOMMENDED

One VM that runs FastAPI + BERT like your local `localhost:8000`.

### 0. Ready locally

```bash
cd "/Users/shaanyadav/Documents/New OpenCode Project/Cognizant"
ls bert_aste_final/model.safetensors  # 415M must exist
du -sh bert_aste_final/  # 426M
```

### 1. Make Dockerfile (already at Cognizant/Dockerfile if not, create)

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
# keep bert_aste_final inside image (426M)
EXPOSE 8000
CMD ["uvicorn", "cfa.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

`requirements.txt` must have `transformers torch accelerate safetensors fastapi uvicorn`

### 2. Create EC2

1. AWS Console → EC2 → Launch instance → `Ubuntu 22.04` → `t3.medium` (2 vCPU 4GB, BERT needs 3GB RAM) → key pair `cfa-key.pem`
2. Security group: open `22` (SSH), `8000` (FastAPI), `80`
3. Storage: 30 GB gp3 (model 0.4GB + docker)
4. Launch → copy `Public IPv4` like `3.XX.XX.XX`

### 3. Push & run (from your Mac)

```bash
# on Mac: build for linux
docker build -t cfa-backend .

# on EC2 (SSH):
ssh -i cfa-key.pem ubuntu@3.XX.XX.XX
sudo apt update && sudo apt install -y docker.io
sudo usermod -aG docker ubuntu && newgrp docker

# copy project (or git pull):
git clone https://github.com/Shaanworkspace/customer-feedback-insight-system.git
cd customer-feedback-insight-system/Cognizant  # if Dockerfile at root
# OR scp your local bert_aste_final:
scp -i cfa-key.pem -r bert_aste_final ubuntu@3.XX.XX.XX:~/customer-feedback-insight-system/Cognizant/

# run
docker build -t cfa-backend .
docker run -d --restart always -p 80:8000 --env-file .env -v $(pwd)/bert_aste_final:/app/bert_aste_final cfa-backend
# check logs:
docker logs -f $(docker ps -q)
curl http://localhost:8000/health  # → {"status":"ok"}
```

### 4. Point frontend to it

```bash
# in Cognizant/frontend/.env or Vercel env:
VITE_API_BASE=http://3.XX.XX.XX
# rebuild frontend: npm run build → Vercel deploy
```

Done. Your `model.safetensors` stays on EC2 disk, no S3 needed. Logs: `docker logs` shows `is_trained True`.

**Cost:** t3.medium $0.0416/hr ≈ $12/mo + 30GB $2. You can use `t3.small` ($7) if RAM tight but BERT may OOM.

---

## Option B: AWS App Runner (EASIEST MANAGED, no SSH)

Same docker, AWS runs it.

1. Push image to ECR:
```bash
aws ecr create-repository --repository-name cfa-backend --region ap-south-1
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.ap-south-1.amazonaws.com
docker tag cfa-backend:latest <account>.dkr.ecr.ap-south-1.amazonaws.com/cfa-backend:latest
docker push <account>.dkr.ecr.ap-south-1.amazonaws.com/cfa-backend:latest
```
2. Console → App Runner → Create service → Source ECR → Port 8000 → Env vars `DATABASE_URL`, `JWT_SECRET` → Deploy → get URL `https://xxx.awsapprunner.com` → set as `VITE_API_BASE`.

**Pros:** auto scale, HTTPS, no server to manage. **Cons:** a bit pricier ($18/mo), first deploy 5 min.

---

## Option C: Lightsail (CHEAPEST UI)

EC2 but simpler UI: Lightsail → Create container service → Push image (same as above) → Deploy. $7/mo. Same steps as App Runner.

---

## What about your current Render?

Render = same as EC2/App Runner (container with 400M). If Render works, no need to move — just add `bert_aste_final/` via `git lfs` or S3 download at startup. AWS is only if you want AWS logo for hackathon.

---

## How to verify after deploy (same logs you just added)

Open browser console (F12 → Console), you will see:

```
[CFA] [INIT] API base = http://3.XX.XX.XX
[CFA] [UPLOAD] uploadReviews() called {name: "final.csv", size: 4200}
[CFA] [UPLOAD] POST /api/v1/upload → sending to http://3.XX.XX.XX/api/v1/upload
[CFA] [MODEL] ⏳ Request ab MODEL (BERT) pe ja rahi hai
[CFA] [MODEL] ✅ MODEL se response aa gaya in 1840ms — status 200 (BERT ne kaam kiya)
[CFA] [UPLOAD] ✅ Upload + MODEL success {total: 36, concerns: 8}
```

If you see:

* `file backend tak gayi hi nahi` → Security group / CORS / backend down
* `15s+ lag gaya — MODEL fang gaya` → t3.medium RAM low → upgrade to t3.large or add `HF_HOME=/tmp`
* `401 Unauthorized` → token expired → redirect to /?view=login (handled)

Backend logs (EC2 `docker logs`) will also show `is_trained True` and `BERT_DIR /app/bert_aste_final exists True`.

---

## One-liner to test after deploy

```bash
curl -X POST http://3.XX.XX.XX/api/v1/auth/signup -H "Content-Type: application/json" -d '{"username":"aws@test.com","password":"Test1234!","first_name":"AWS","email":"aws@test.com"}'
# take token, then:
curl -X POST http://3.XX.XX.XX/api/v1/upload -H "Authorization: Bearer <token>" -F "file=@final.csv" | python3 -m json.tool
# → total_reviews 36
```

Need me to make the `Dockerfile` + `docker-compose.yml` ready for `docker build`? Bol do, 1 command me bana deta hoon.
