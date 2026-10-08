#!/usr/bin/env bash
# Sobe o lab com profiles do docker compose.
# Uso (na raiz do repo):
#   ./scripts/lan-up.sh local
#   ./scripts/lan-up.sh storage
#   ./scripts/lan-up.sh nodes
#   ./scripts/lan-up.sh both    # storage + nodes

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MODE="${1:-local}"
ENV_FILE="${LAB_ENV_FILE:-$ROOT/lab.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Arquivo não encontrado: $ENV_FILE (copie lab.env.example → lab.env)" >&2
  exit 1
fi

case "$MODE" in
  local)
    exec docker compose --profile local --env-file "$ENV_FILE" -f "$ROOT/docker-compose.yml" up --build --remove-orphans "${@:2}"
    ;;
  storage)
    exec docker compose --profile storage --env-file "$ENV_FILE" -f "$ROOT/docker-compose.yml" up --build "${@:2}"
    ;;
  nodes)
    exec docker compose --profile nodes --env-file "$ENV_FILE" -f "$ROOT/docker-compose.yml" up --build "${@:2}"
    ;;
  both)
    exec docker compose --profile storage --profile nodes --env-file "$ENV_FILE" -f "$ROOT/docker-compose.yml" up --build "${@:2}"
    ;;
  *)
    echo "Modo: local | storage | nodes | both" >&2
    exit 1
    ;;
esac
