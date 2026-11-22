#!/usr/bin/env bash
# Control script: exit 0 when the service is healthy, non-zero otherwise.
set -euo pipefail

URL="${HEALTH_URL:-http://127.0.0.1:${APP_PORT:-3000}/health}"
ATTEMPTS="${HEALTH_ATTEMPTS:-30}"
INTERVAL="${HEALTH_INTERVAL:-2}"

echo "[healthcheck] target=${URL} attempts=${ATTEMPTS}"

for (( i = 1; i <= ATTEMPTS; i++ )); do
  body="$(curl -fsS --max-time 5 "${URL}" 2>/dev/null || true)"
  if printf '%s' "${body}" | grep -q '"status":"ok"'; then
    echo "[healthcheck] OK on attempt ${i}: ${body}"
    exit 0
  fi
  sleep "${INTERVAL}"
done

echo "[healthcheck] FAILED after ${ATTEMPTS} attempts" >&2
exit 1
