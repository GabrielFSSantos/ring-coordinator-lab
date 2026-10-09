#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
export NODE_PORTS="${NODE_PORTS:-3002,3003,3004,3005}"
export NODE_HTTP_PORT_OFFSET="${NODE_HTTP_PORT_OFFSET:-1000}"
export STORAGE_URL="${STORAGE_URL:-http://127.0.0.1:4000}"
export MIN_TX="${MIN_TX:-3}"
export PHASE_TIMEOUT_SEC="${PHASE_TIMEOUT_SEC:-90}"
export POLL_MS="${POLL_MS:-2000}"
export LEADER_COOLDOWN_MS="${LEADER_COOLDOWN_MS:-25000}"

exec node "$SCRIPT_DIR/lab-acceptance-checklist.mjs"
