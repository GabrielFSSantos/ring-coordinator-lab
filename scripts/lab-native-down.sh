#!/usr/bin/env bash
set -euo pipefail
# shellcheck source=lab-native-common.sh
source "$(cd "$(dirname "$0")" && pwd)/lab-native-common.sh"
PF="$(lab_native_pid_file)"

if [[ ! -f "$PF" ]] || [[ ! -s "$PF" ]]; then
  echo "Nenhum processo nativo registrado ($PF)." >&2
  exit 0
fi

while read -r name pid; do
  [[ -z "$pid" ]] && continue
  if kill -0 "$pid" 2>/dev/null; then
    echo "Encerrando ${name} (pid ${pid})…"
    kill -TERM "$pid" 2>/dev/null || true
  fi
done <"$PF"

sleep 1
while read -r _ pid; do
  [[ -z "$pid" ]] && continue
  kill -KILL "$pid" 2>/dev/null || true
done <"$PF"

: >"$PF"
echo "Runtime nativo encerrado."
