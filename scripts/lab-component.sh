#!/usr/bin/env bash
# storage | node (Docker quando --docker no ./lab node)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPONENT="${1:-}"
NATIVE="${LAB_USE_NATIVE:-0}"
LAB_USE_DOCKER="${LAB_USE_DOCKER:-0}"
# shellcheck source=lab-compose.sh
source "$ROOT/scripts/lab-compose.sh"

usage() {
  echo "Uso: lab-component.sh storage|node" >&2
  exit 1
}

[[ -z "$COMPONENT" ]] && usage

case "$COMPONENT" in
  storage)
    if [[ "$NATIVE" == "1" ]] || ! command -v docker >/dev/null 2>&1; then
      "$ROOT/scripts/lab-env-init.sh" storage native
      exec "$ROOT/scripts/lab-native-storage.sh"
    fi
    "$ROOT/scripts/lab-env-init.sh" storage docker
    mkdir -p "$ROOT/data"
    mapfile -t COMPOSE_FILES < <(lab_compose_files)
    lab_compose_profile_storage
    exec docker compose --env-file "$ROOT/lab.env" "${COMPOSE_FILES[@]}" up --build -d storage
    ;;
  node)
    if [[ "$LAB_USE_DOCKER" != "1" ]]; then
      exec "$ROOT/scripts/lab-native-node.sh"
    fi
    "$ROOT/scripts/lab-env-init.sh" node docker
    mkdir -p "$ROOT/data"
    mapfile -t COMPOSE_FILES < <(lab_compose_files)
    lab_compose_profile_node
    exec docker compose --env-file "$ROOT/lab.env" "${COMPOSE_FILES[@]}" up --build -d node-join
    ;;
  *)
    usage
    ;;
esac
