#!/usr/bin/env bash
# Arquivos compose do lab.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

lab_compose_files() {
  local files=(-f "$ROOT/docker-compose.yml")
  if [[ "${LAB_USE_HOSTNET:-}" == "1" ]]; then
    files+=(-f "$ROOT/docker-compose.hostnet.yml")
  fi
  printf '%s\n' "${files[@]}"
}

lab_compose_profile_local() {
  export COMPOSE_PROFILES=local
}

lab_compose_profile_node() {
  export COMPOSE_PROFILES=node
}

lab_compose_profile_storage() {
  export COMPOSE_PROFILES=storage
}

lab_compose_profiles_all() {
  export COMPOSE_PROFILES=local,node,storage
}

lab_local_node_services() {
  printf '%s\n' node-3002 node-3003 node-3004 node-3005
}
