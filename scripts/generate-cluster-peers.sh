#!/usr/bin/env bash
# Gera CLUSTER_PEERS para N nós no mesmo ADVERTISE_HOST (v2 LAN / npm local).
# Uso:
#   ADVERTISE_HOST=192.168.0.10 ADVERTISE_PORT_BASE=3002 NODE_COUNT=4 ./scripts/generate-cluster-peers.sh
#   ADVERTISE_HOST=192.168.0.11 ADVERTISE_PORT_BASE=3006 NODE_COUNT=2 ./scripts/generate-cluster-peers.sh
set -euo pipefail

HOST="${ADVERTISE_HOST:-127.0.0.1}"
BASE="${ADVERTISE_PORT_BASE:-3002}"
COUNT="${NODE_COUNT:-1}"

if [[ "$COUNT" -lt 1 || "$COUNT" -gt 4 ]]; then
  echo "NODE_COUNT deve ser 1–4" >&2
  exit 1
fi

peers=()
for ((i = 0; i < COUNT; i++)); do
  port=$((BASE + i))
  peers+=("${HOST}:${port}")
done

echo "${peers[*]}" | tr ' ' ','
