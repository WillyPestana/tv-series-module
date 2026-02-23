#!/usr/bin/env bash
set -euo pipefail

printf '\n==> CI pipeline start\n\n'

./scripts/check.sh

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required for compose validation."
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required for health checks."
  exit 1
fi

cleanup() {
  docker compose down -v --remove-orphans || true
}

trap cleanup EXIT

docker compose up --build -d

printf '\n==> Waiting for API health check\n'
for i in $(seq 1 60); do
  if curl -fsS http://localhost:7777/health >/dev/null 2>&1; then
    echo "Health check passed."
    printf '\n==> CI pipeline passed\n'
    exit 0
  fi
  sleep 2
done

echo "Health check timed out."
docker compose logs --no-color app || true
exit 1
