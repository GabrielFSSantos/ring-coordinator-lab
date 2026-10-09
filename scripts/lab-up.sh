#!/usr/bin/env bash
# Compat: redireciona para ./lab
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
case "${1:-full}" in
  full|local|both|start) exec "$ROOT/lab" start "${@:2}" ;;
  worker|nodes|join) exec "$ROOT/lab" node "${@:2}" ;;
  tail|logs) exec "$ROOT/lab" logs "${@:2}" ;;
  down) exec "$ROOT/lab" down "${@:2}" ;;
  storage) exec "$ROOT/lab" storage "${@:2}" ;;
  *)
    echo "Use: ./lab storage|start|node|logs|down" >&2
    exit 1
    ;;
esac
