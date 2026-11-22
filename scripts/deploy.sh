#!/usr/bin/env bash
# Bring the tagged image up in the test environment, then verify /health.
set -euo pipefail

: "${APP_IMAGE:?APP_IMAGE must be set}"
export APP_IMAGE

echo "[deploy] image=${APP_IMAGE}"
docker compose pull app
docker compose up -d --no-build
bash scripts/healthcheck.sh
echo "[deploy] successfully deployed ${APP_IMAGE}"
