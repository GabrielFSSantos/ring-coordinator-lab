#!/usr/bin/env bash
# Uso: source scripts/load-lab-env.sh [caminho/lab.env]
set -a
ENV_FILE="${1:-$(dirname "$0")/../lab.env}"
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
elif [[ -f "$(dirname "$0")/../lab.env.example" ]]; then
  # shellcheck disable=SC1091
  source "$(dirname "$0")/../lab.env.example"
fi
set +a
