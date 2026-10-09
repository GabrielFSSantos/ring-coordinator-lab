#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${STORAGE_HTTP_PORT:-4000}"
NODE_HTTP="${1:-4002}"

try_curl() {
  curl -m 4 -sf "$1" 2>/dev/null
}

body="$(try_curl "http://127.0.0.1:${PORT}/v1/health")" || body=""
if [[ -z "$body" ]] && docker ps --format '{{.Names}}' 2>/dev/null | grep -qx ring-storage; then
  body="$(docker exec ring-storage node -e \
    "fetch('http://127.0.0.1:${PORT}/v1/health').then(r=>r.text()).then(t=>process.stdout.write(t)).catch(()=>process.exit(1))" 2>/dev/null)" || true
fi
if [[ -z "$body" ]]; then
  echo "storage: sem resposta em 127.0.0.1:${PORT} (lab rodando? ./lab start)" >&2
  exit 1
fi
echo "storage /v1/health: $body"

cluster="$(try_curl "http://127.0.0.1:${NODE_HTTP}/v1/cluster/state")" || cluster=""
if [[ -n "$cluster" ]]; then
  echo "node :${NODE_HTTP}/v1/cluster/state: $cluster"
else
  echo "node :${NODE_HTTP}/v1/cluster/state: (sem resposta — aguarde eleição ou use ./lab logs)" >&2
fi
