#!/usr/bin/env bash
set -euo pipefail
# shellcheck source=lab-native-common.sh
source "$(cd "$(dirname "$0")" && pwd)/lab-native-common.sh"
ROOT="$(lab_native_root)"

lab_native_require_node
lab_native_ensure_deps
"$ROOT/scripts/lab-env-init.sh" join native

if [[ ! -f "$ROOT/lab.env" ]]; then
  echo "lab.env não encontrado." >&2
  exit 1
fi
# shellcheck disable=SC1091
set -a && source "$ROOT/lab.env" && set +a
if [[ -z "${STORAGE_URL:-}" ]]; then
  echo "STORAGE_URL vazio — aguarde mDNS ou defina LAB_STORAGE_HOST no lab.env e rode de novo." >&2
  exit 1
fi

mkdir -p "$ROOT/data"
lab_native_reset_pids

(
  cd "$ROOT/src"
  node server/bootstrap/main.js
) &
lab_native_record_pid node "$!"

(
  cd "$ROOT/src"
  LOG_STDOUT_MODE=off HOSTNAME=ring-tail LAB_HOST_NAME=ring-tail \
    node log-viewer/bootstrap/main.js
) &
lab_native_record_pid tail "$!"

echo "Join nativo (1 nó + tail). STORAGE_URL=${STORAGE_URL}"
echo "Narrativa: ./lab logs | ./lab health"
