#!/usr/bin/env bash
# PC 2 (gfswo) — 4 nós + lan-tail. Rode na raiz do repo (WSL).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PRESET="${ROOT}/configs/pc2-gfswo.lab.env"

if [[ ! -f "$PRESET" ]]; then
  echo "Preset não encontrado: $PRESET" >&2
  exit 1
fi

cp "$PRESET" "$ROOT/lab.env"
echo "lab.env ← configs/pc2-gfswo.lab.env"

PC_A="192.168.3.131"
if curl -sf "http://${PC_A}:4000/v1/health" >/dev/null; then
  echo "Storage PC1 (${PC_A}:4000) OK"
else
  echo "AVISO: não alcançou http://${PC_A}:4000/v1/health — suba o PC1 antes (storage na porta 4000)." >&2
  echo "No PC1 (WSL): docker compose --profile local --env-file lab.env up --build" >&2
  echo "  ou: cp configs/pc1-gabriel-8nodes.lab.env lab.env && docker compose --profile storage --profile nodes --env-file lab.env up --build" >&2
fi

exec docker compose --profile nodes --profile tail --env-file "$ROOT/lab.env" -f "$ROOT/docker-compose.yml" up --build
