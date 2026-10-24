#!/bin/bash
set -euo pipefail

# Jalankan dari salinan sementara: git reset --hard bisa menimpa file ini saat bash masih membacanya.
if [ -z "${DEPLOY_COPY:-}" ]; then
  REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  copy="$(mktemp)"
  cp "${BASH_SOURCE[0]}" "$copy"
  DEPLOY_COPY="$copy" REPO_DIR="$REPO_DIR" exec bash "$copy" "$@"
fi
trap 'rm -f "$DEPLOY_COPY"' EXIT

ts() { date '+%Y-%m-%dT%H:%M:%S%z'; }

exec 9>/tmp/it-ticketing-deploy.lock
flock -w 1800 9 || { echo "[$(ts)] deploy: lock timeout"; exit 1; }

cd "$REPO_DIR"
echo "[$(ts)] deploy: start"

git fetch origin main
git reset --hard origin/main
echo "[$(ts)] deploy: now at $(git rev-parse --short HEAD)"

docker compose up -d --build app

for _ in $(seq 1 30); do
  if curl -fsS -o /dev/null http://127.0.0.1:8080/login; then
    echo "[$(ts)] deploy: app healthy"
    exit 0
  fi
  sleep 2
done
echo "[$(ts)] deploy: app not responding on :8080 after 60s"
docker compose logs --tail 30 app || true
exit 1
