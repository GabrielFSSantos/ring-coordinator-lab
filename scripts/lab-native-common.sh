#!/usr/bin/env bash
# Funções compartilhadas pelo runtime nativo (Node, sem Docker).
set -euo pipefail

lab_native_root() {
  if [[ -z "${LAB_NATIVE_ROOT:-}" ]]; then
    LAB_NATIVE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
  fi
  echo "$LAB_NATIVE_ROOT"
}

lab_native_pid_file() {
  echo "$(lab_native_root)/.lab/native.pids"
}

lab_native_require_node() {
  if ! command -v node >/dev/null 2>&1; then
    echo "Node.js 20+ é necessário para o runtime nativo (https://nodejs.org/)." >&2
    exit 1
  fi
  local major
  major="$(node -p "parseInt(process.version.slice(1).split('.')[0], 10)")"
  if [[ "$major" -lt 20 ]]; then
    echo "Node.js 20+ é necessário (versão atual: $(node -v))." >&2
    exit 1
  fi
}

lab_native_ensure_deps() {
  local root
  root="$(lab_native_root)"
  if [[ ! -d "$root/src/node_modules" ]]; then
    echo "Instalando dependências (npm ci em src/)…" >&2
    (cd "$root/src" && npm ci)
  fi
}

lab_native_reset_pids() {
  local pf
  pf="$(lab_native_pid_file)"
  mkdir -p "$(dirname "$pf")"
  : >"$pf"
}

lab_native_record_pid() {
  local name="$1"
  local pid="$2"
  echo "${name} ${pid}" >>"$(lab_native_pid_file)"
}

lab_native_wait_storage() {
  local port="${STORAGE_HTTP_PORT:-4000}"
  local i
  for i in $(seq 1 40); do
    if curl -m 2 -sf "http://127.0.0.1:${port}/v1/health" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.5
  done
  echo "Storage não respondeu em 127.0.0.1:${port}." >&2
  return 1
}

lab_native_is_running() {
  [[ -f "$(lab_native_pid_file)" ]] && [[ -s "$(lab_native_pid_file)" ]]
}

lab_native_runtime_from_env() {
  local root env
  root="$(lab_native_root)"
  env="$root/lab.env"
  if [[ -f "$env" ]] && grep -q '^LAB_RUNTIME=native' "$env" 2>/dev/null; then
    return 0
  fi
  return 1
}
