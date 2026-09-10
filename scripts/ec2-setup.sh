#!/bin/bash
# Run on EC2 Ubuntu 22.04 after ssh -i cfa-key.pem ubuntu@<EC2_IP>
# Installs Docker + pulls your code + runs backend with BERT

set -e
echo "=== EC2 setup for CFA backend+BERT ==="

# 1. Docker
if ! command -v docker &> /dev/null; then
  echo "[1/4] Installing Docker..."
  sudo apt-get update -y
  sudo apt-get install -y docker.io git
  sudo usermod -aG docker $USER
  sudo systemctl enable --now docker
else
  echo "[1/4] Docker already installed"
fi

# 2. Clone or pull
if [ -d "customer-feedback-insight-system" ]; then
  echo "[2/4] Pulling latest..."
  cd customer-feedback-insight-system
  git pull
  cd Cognizant || cd .
else
  echo "[2/4] Cloning..."
  git clone https://github.com/Shaanworkspace/customer-feedback-insight-system.git
  cd customer-feedback-insight-system/Cognizant
fi
# If Cognizant is repo root, adjust:
if [ ! -f "Dockerfile" ]; then
  if [ -f "../Cognizant/Dockerfile" ]; then cd ../Cognizant; fi
fi

# 3. Env file — create .env on EC2 (copy from local .env, never commit)
echo "[3/4] Check .env..."
if [ ! -f ".env" ]; then
  echo "CREATE .env on EC2 with:"
  echo "DATABASE_URL=mysql+pymysql://avnadmin:AVNS_bftr8UKWppww-0ANAOZ@mysql-197d3cc9-shaanyworkspace.c.aivencloud.com:14273/cfa"
  echo "JWT_SECRET=change-me-32chars"
  echo "Then re-run docker build"
  cp .env.example .env
  echo "Edit .env now: nano .env"
  exit 1
fi

# 4. Build & run
echo "[4/4] Building docker image (first time 5-8 min for torch)..."
sudo docker build -t cfa-backend .

echo "Running..."
sudo docker rm -f cfa-backend 2>/dev/null || true
sudo docker run -d --restart always --name cfa-backend -p 80:8000 --env-file .env cfa-backend

echo "Waiting 10s for BERT load..."
sleep 10
curl -s http://localhost:8000/health || curl -s http://localhost/health || echo "Health check failed — check docker logs"
sudo docker logs --tail 50 cfa-backend || true
echo "=== Done. Frontend VITE_API_BASE=http://<EC2_IP> set in Vercel ==="
