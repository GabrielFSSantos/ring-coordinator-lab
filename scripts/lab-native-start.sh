#!/usr/bin/env bash
set -euo pipefail
# shellcheck source=lab-native-common.sh
source "$(cd "$(dirname "$0")" && pwd)/lab-native-common.sh"
ROOT="$(lab_native_root)"

lab_native_require_node
lab_native_ensure_deps
"$ROOT/scripts/lab-env-init.sh" start native
mkdir -p "$ROOT/data"
lab_native_reset_pids

(
  cd "$ROOT/src"
  NODE_COUNT=4 node server/bootstrap/main.js
) &
lab_native_record_pid node "$!"

echo "Lab nativo: 4 nós (supervisor). Banco: ./lab storage | Narrativa: ./lab logs"
echo "HTTP: :4002 (cluster). PIDs em .lab/native.pids"

wait
