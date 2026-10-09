#!/usr/bin/env bash
# IPv4 LAN para ADVERTISE_HOST (mDNS + anel).
# Ignora loopback, Docker (172.16–31), link-local e o alias WSL 10.255.255.254 no lo.
set -euo pipefail

is_excluded_ip() {
  local ip="$1"
  [[ -z "$ip" ]] && return 0
  [[ "$ip" == 127.* ]] && return 0
  [[ "$ip" == 169.254.* ]] && return 0
  case "$ip" in
    172.1[6-9].*|172.2[0-9].*|172.3[0-1].*) return 0 ;;
    10.255.255.254) return 0 ;;
  esac
  return 1
}

# Menor pontuação = melhor candidato.
score_candidate() {
  local dev="$1"
  local ip="$2"
  local score=50
  [[ "$dev" == "lo" ]] && score=$((score + 80))
  case "$ip" in
    192.168.*) score=$((score - 45)) ;;
    10.*) score=$((score + 5)) ;;
  esac
  case "$dev" in
    eth*|en*|wlan*|wl*) score=$((score - 25)) ;;
  esac
  echo "$score"
}

pick_best_from_stream() {
  local best_ip=""
  local best_score=999
  local dev ip score
  while read -r dev ip; do
    [[ -z "${ip:-}" ]] && continue
    is_excluded_ip "$ip" && continue
    case "$ip" in
      10.*|192.168.*)
        score="$(score_candidate "$dev" "$ip")"
        if [[ "$score" -lt "$best_score" ]]; then
          best_score=$score
          best_ip="$ip"
        fi
        ;;
    esac
  done
  if [[ -n "$best_ip" ]]; then
    echo "$best_ip"
    return 0
  fi
  return 1
}

if command -v ip >/dev/null 2>&1; then
  pick_best_from_stream < <(
    ip -4 -o addr show 2>/dev/null | awk '{print $2, $4}' | sed 's|/.*||'
  ) && exit 0
fi

if command -v hostname >/dev/null 2>&1; then
  pick_best_from_stream < <(
    hostname -I 2>/dev/null | tr ' ' '\n' | awk '{print "?", $1}'
  ) && exit 0
fi

echo "127.0.0.1"
