#!/usr/bin/env bash
set -euo pipefail
source "$(cd "$(dirname "$0")" && pwd)/lab-native-common.sh"
ROOT="$(lab_native_root)"
lab_native_require_node
lab_native_ensure_deps
"$ROOT/scripts/lab-env-init.sh" node native
mkdir -p "$ROOT/data"
lab_native_reset_pids

if [[ -f "$ROOT/lab.env" ]]; then
  # shellcheck disable=SC1091
  set -a && source "$ROOT/lab.env" && set +a
fi

(
  cd "$ROOT/src"
  node server/bootstrap/main.js
) &
lab_native_record_pid node "$!"

echo "Nó nativo (porta ${NODE_PORT:-$ADVERTISE_PORT_BASE}). STORAGE_URL=${STORAGE_URL:-<mDNS>}"
echo "Narrativa: ./lab logs | ./lab health"

wait
