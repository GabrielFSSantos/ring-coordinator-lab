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
  echo "No PC1 (WSL): ./scripts/run-on-pc-a.sh" >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "ERRO: docker não encontrado no WSL. Ative Docker Desktop → Settings → WSL integration (esta distro)." >&2
  exit 1
fi

exec docker compose --profile nodes --profile tail --env-file "$ROOT/lab.env" -f "$ROOT/docker-compose.yml" up --build
