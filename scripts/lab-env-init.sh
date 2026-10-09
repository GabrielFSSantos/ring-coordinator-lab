#!/usr/bin/env bash
# Gera/atualiza lab.env — papéis: storage | start | node | logs
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ROLE="${1:-start}"
RUNTIME="${2:-${LAB_RUNTIME:-docker}}"
ENV_FILE="${LAB_ENV_FILE:-$ROOT/lab.env}"
DETECT="$ROOT/scripts/detect-lan-ip.sh"
LAN_IP="$("$DETECT")"
HOST_NAME="$(hostname | tr ' ' '-' | tr '[:upper:]' '[:lower:]')"

ADVERTISE_PORT_BASE="${ADVERTISE_PORT_BASE:-3002}"
STORAGE_URL=""
STORAGE_MODE="none"
LAB_DOCKER_STORAGE_URL="http://storage:4000"

discover_storage() {
  if [[ -f "$ROOT/scripts/discover-join-env.js" ]]; then
    # shellcheck disable=SC1090
    eval "$(cd "$ROOT/src" && node "$ROOT/scripts/discover-join-env.js" 2>/dev/null || true)"
  fi
  STORAGE_URL="${DISCOVERED_STORAGE_URL:-}"
  if [[ "$ROLE" == "node" ]]; then
    ADVERTISE_PORT_BASE="${DISCOVERED_PORT_BASE:-3006}"
  fi
}

FALLBACK_STORAGE_HOST=""
if [[ -f "$ENV_FILE" ]]; then
  if grep -q '^LAB_HOST_NAME=' "$ENV_FILE" 2>/dev/null; then
    HOST_NAME="$(grep '^LAB_HOST_NAME=' "$ENV_FILE" | head -1 | cut -d= -f2-)"
  fi
  if grep -q '^LAB_STORAGE_HOST=' "$ENV_FILE" 2>/dev/null; then
    FALLBACK_STORAGE_HOST="$(grep '^LAB_STORAGE_HOST=' "$ENV_FILE" | head -1 | cut -d= -f2-)"
  fi
  if grep -q '^LAB_DOCKER_STORAGE_URL=' "$ENV_FILE" 2>/dev/null; then
    LAB_DOCKER_STORAGE_URL="$(grep '^LAB_DOCKER_STORAGE_URL=' "$ENV_FILE" | head -1 | cut -d= -f2-)"
  fi
fi

case "$ROLE" in
  logs)
    echo "lab.env (logs) — mantido; use STORAGE_URL existente para ./lab logs"
    exit 0
    ;;
  storage)
    STORAGE_MODE="primary"
    STORAGE_URL="http://127.0.0.1:4000"
    ADVERTISE_PORT_BASE=3002
    if [[ "$RUNTIME" == "native" ]]; then
      LAB_DOCKER_STORAGE_URL="http://host.docker.internal:4000"
    else
      LAB_DOCKER_STORAGE_URL="http://storage:4000"
    fi
    ;;
  start)
    discover_storage
    ADVERTISE_PORT_BASE=3002
    if [[ -z "$STORAGE_URL" && -n "$FALLBACK_STORAGE_HOST" ]]; then
      STORAGE_URL="http://${FALLBACK_STORAGE_HOST}:4000"
    fi
    ;;
  node)
    discover_storage
    if [[ -z "$STORAGE_URL" && -n "$FALLBACK_STORAGE_HOST" ]]; then
      STORAGE_URL="http://${FALLBACK_STORAGE_HOST}:4000"
    fi
    ;;
  *)
    echo "Papel lab-env-init desconhecido: $ROLE" >&2
    exit 1
    ;;
esac

if [[ "$RUNTIME" == "native" ]]; then
  DATABASE_PATH="${ROOT}/data/ledger.db"
  LEDGER_SCHEMA_PATH="${ROOT}/schema-ledger.sql"
else
  DATABASE_PATH="/data/ledger.db"
  LEDGER_SCHEMA_PATH="/app/schema-ledger.sql"
fi

NODE_COUNT=4
NODE_PORT_LINE=""
NODE_JOIN_HTTP_PORT_LINE=""
if [[ "$ROLE" == "node" && "$RUNTIME" == "native" ]]; then
  NODE_COUNT=1
  NODE_PORT_LINE="NODE_PORT=${ADVERTISE_PORT_BASE}"
elif [[ "$ROLE" == "node" && "$RUNTIME" == "docker" ]]; then
  NODE_COUNT=1
  NODE_JOIN_HTTP_PORT_LINE="NODE_JOIN_HTTP_PORT=$((ADVERTISE_PORT_BASE + 1000))"
fi

SIM_MODE=manual
if [[ "$ROLE" == "start" ]]; then
  SIM_TX_ENABLED="${SIM_TX_ENABLED:-true}"
  SIM_LEADER_SELF_TERM="${SIM_LEADER_SELF_TERM:-true}"
else
  SIM_TX_ENABLED="${SIM_TX_ENABLED:-false}"
  SIM_LEADER_SELF_TERM="${SIM_LEADER_SELF_TERM:-false}"
fi
SIM_LEADER_TENURE_MS="${SIM_LEADER_TENURE_MS:-90000}"

LAB_ROLE="$ROLE"
if [[ "$ROLE" == "storage" ]]; then
  LAB_ROLE=storage
fi

cat > "$ENV_FILE" <<EOF
# Gerado por scripts/lab-env-init.sh
# mDNS falhou: LAB_STORAGE_HOST=<IP-do-banco> no lab.env
LAB_RUNTIME=${RUNTIME}
LAB_STORAGE_HOST=${FALLBACK_STORAGE_HOST}
LAB_DOCKER_STORAGE_URL=${LAB_DOCKER_STORAGE_URL}
LAB_ROLE=${LAB_ROLE}
LAB_COMPONENTS=${ROLE}
LAB_HOST_NAME=${HOST_NAME}
ADVERTISE_HOST=${LAN_IP}
ADVERTISE_PORT_BASE=${ADVERTISE_PORT_BASE}
NODE_COUNT=${NODE_COUNT}
NODE_HTTP_PORT_OFFSET=1000
${NODE_PORT_LINE}
${NODE_JOIN_HTTP_PORT_LINE}

STORAGE_MODE=${STORAGE_MODE}
STORAGE_URL=${STORAGE_URL}
STORAGE_HTTP_PORT=4000
STORAGE_WRITE_TOKEN=lab-write-token
STORAGE_URL_REQUIRED=true
USE_STORAGE_HTTP=true

DISCOVERY_MODE=mdns
CLUSTER_PEERS=
BOOTSTRAP_PEER=

DATABASE_PATH=${DATABASE_PATH}
LEDGER_SCHEMA_PATH=${LEDGER_SCHEMA_PATH}
LEDGER_INITIAL_BALANCE=10000.00
LEDGER_RESET_ON_START=true

SIM_MODE=${SIM_MODE}
SIM_TX_ENABLED=${SIM_TX_ENABLED}
SIM_TX_BURST=1
SIM_LEADER_SELF_TERM=${SIM_LEADER_SELF_TERM}
SIM_LEADER_TENURE_MS=${SIM_LEADER_TENURE_MS}

LOG_STDOUT_MODE=off
LOG_TIMELINE_PERSIST=true
LOG_FORMAT=human
LOG_STYLE=box
EOF

echo "lab.env (${ROLE}/${RUNTIME}) ADVERTISE_HOST=${LAN_IP} ADVERTISE_PORT_BASE=${ADVERTISE_PORT_BASE} STORAGE_URL=${STORAGE_URL:-<descoberta em runtime>}"