#!/usr/bin/env bash
# Junta dois CSVs de CLUSTER_PEERS (host:port), sem duplicar portas.
# Uso: merge-cluster-peers.sh "a:1,b:2" "c:3,d:4"
set -euo pipefail

merge_two() {
  local a="${1:-}"
  local b="${2:-}"
  python3 - <<'PY' "$a" "$b"
import sys
seen = set()
out = []
for csv in sys.argv[1:3]:
    for part in csv.split(","):
        part = part.strip()
        if not part:
            continue
        port = part.rsplit(":", 1)[-1]
        if port in seen:
            continue
        seen.add(port)
        out.append(part)
print(",".join(out))
PY
}

merge_two "${1:-}" "${2:-}"
