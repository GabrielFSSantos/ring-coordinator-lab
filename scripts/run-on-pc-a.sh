#!/usr/bin/env bash
# PC 1 (Gabriel / 192.168.3.131) — banco + 4 nós + lan-tail (background).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PRESET="${ROOT}/configs/pc1-gabriel-8nodes.lab.env"

if [[ ! -f "$PRESET" ]]; then
  echo "Preset não encontrado: $PRESET" >&2
  exit 1
fi

cp "$PRESET" "$ROOT/lab.env"
mkdir -p "$ROOT/data"
echo "lab.env ← configs/pc1-gabriel-8nodes.lab.env"

exec docker compose --profile storage --profile nodes --env-file "$ROOT/lab.env" -f "$ROOT/docker-compose.yml" up --build
