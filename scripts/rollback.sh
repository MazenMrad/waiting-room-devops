#!/usr/bin/env bash
# Roll the test environment back to a previously published image tag.
set -euo pipefail

: "${APP_IMAGE:?APP_IMAGE must be set}"
export APP_IMAGE

echo "[rollback] target=${APP_IMAGE}"
docker compose pull app
docker compose up -d --no-build
bash scripts/healthcheck.sh
echo "[rollback] successfully rolled back to ${APP_IMAGE}"
