#!/usr/bin/env bash
set -euo pipefail
source "$(cd "$(dirname "$0")" && pwd)/lab-native-common.sh"
ROOT="$(lab_native_root)"
lab_native_require_node
lab_native_ensure_deps
mkdir -p "$ROOT/data"
lab_native_reset_pids
(
  cd "$ROOT/src"
  node storage/bootstrap/main.js
) &
lab_native_record_pid storage "$!"
lab_native_wait_storage
echo "Storage nativo em 127.0.0.1:4000"
