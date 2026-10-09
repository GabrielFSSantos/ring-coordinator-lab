#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=lab-compose.sh
source "$ROOT/scripts/lab-compose.sh"
if ! command -v docker >/dev/null 2>&1; then
  echo "Instale Docker Desktop e ative WSL integration." >&2
  exit 1
fi
"$ROOT/scripts/lab-env-init.sh" join
mkdir -p "$ROOT/data"
mapfile -t COMPOSE_FILES < <(lab_compose_files)
lab_compose_profile_join
exec docker compose --env-file "$ROOT/lab.env" "${COMPOSE_FILES[@]}" up --build -d node-join tail "$@"
