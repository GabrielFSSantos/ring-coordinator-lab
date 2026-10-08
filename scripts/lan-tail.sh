#!/usr/bin/env bash
# Narrativa global na LAN (qualquer PC com STORAGE_URL apontando para o banco).
# Uso:
#   ./scripts/lan-tail.sh          # sobe lan-tail e segue logs
#   ./scripts/lan-tail.sh logs     # só logs (container já rodando)

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${LAB_ENV_FILE:-$ROOT/lab.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Arquivo não encontrado: $ENV_FILE (copie lab.env.example → lab.env)" >&2
  exit 1
fi

if [[ "${1:-}" == "logs" ]]; then
  exec docker compose --profile tail --env-file "$ENV_FILE" -f "$ROOT/docker-compose.yml" logs -f lan-tail
fi

docker compose --profile tail --env-file "$ENV_FILE" -f "$ROOT/docker-compose.yml" up -d --build lan-tail
exec docker compose --profile tail --env-file "$ENV_FILE" -f "$ROOT/docker-compose.yml" logs -f lan-tail
