#!/usr/bin/env bash
set -euo pipefail
# shellcheck source=lab-native-common.sh
source "$(cd "$(dirname "$0")" && pwd)/lab-native-common.sh"
ROOT="$(lab_native_root)"

lab_native_require_node
lab_native_ensure_deps

if [[ -f "$ROOT/lab.env" ]]; then
  # shellcheck disable=SC1091
  set -a && source "$ROOT/lab.env" && set +a
fi

export LOG_STDOUT_MODE=timeline_all
export HOSTNAME=ring-tail
export LAB_HOST_NAME=ring-tail
export LOG_TIMELINE_PERSIST=true

cd "$ROOT/src"
exec node log-viewer/bootstrap/main.js "$@"
