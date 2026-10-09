#!/usr/bin/env bash
# Compat: nomes antigos → lab-up.sh
ROOT="$(cd "$(dirname "$0")" && pwd)"
case "${1:-full}" in
  local|both|full) set -- full "${@:2}" ;;
  storage) set -- storage "${@:2}" ;;
  nodes) set -- worker "${@:2}" ;;
  tail) set -- tail "${@:2}" ;;
esac
exec "$ROOT/lab-up.sh" "$@"
