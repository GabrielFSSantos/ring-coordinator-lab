#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=lab-compose.sh
source "$ROOT/scripts/lab-compose.sh"
"$ROOT/scripts/lab-env-init.sh" start
mkdir -p "$ROOT/data"
if ! command -v docker >/dev/null 2>&1; then
  echo "Instale Docker Desktop e ative WSL integration." >&2
  exit 1
fi
mapfile -t COMPOSE_FILES < <(lab_compose_files)
lab_compose_profile_local
NODE_SERVICES=(node-3002 node-3003 node-3004 node-3005)
if [[ "${LAB_START_DETACHED:-}" == "1" ]]; then
  docker compose --env-file "$ROOT/lab.env" "${COMPOSE_FILES[@]}" up --build --remove-orphans -d \
    "${NODE_SERVICES[@]}" "$@"
  echo "4 nós no ar. Banco: ./lab storage | Narrativa: ./lab logs | HTTP :4002 (cluster)"
  exit 0
fi
echo "Subindo 4 nós (primeiro plano). Banco separado: ./lab storage"
echo "Narrativa (outro terminal): ./lab logs"
echo "HTTP no WSL: :4002 (cluster). Ctrl+C para parar os nós."
docker compose --env-file "$ROOT/lab.env" "${COMPOSE_FILES[@]}" up --build --remove-orphans \
  "${NODE_SERVICES[@]}" "$@"
