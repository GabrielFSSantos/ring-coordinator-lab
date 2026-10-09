#!/usr/bin/env bash
# Segue logs do serviço tail (qualquer PC).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${LAB_ENV_FILE:-$ROOT/lab.env}"

if [[ "${1:-}" == "up" ]]; then
  exec docker compose --env-file "$ENV_FILE" -f "$ROOT/docker-compose.yml" up -d --build tail
fi

exec docker compose --env-file "$ENV_FILE" -f "$ROOT/docker-compose.yml" logs -f tail
