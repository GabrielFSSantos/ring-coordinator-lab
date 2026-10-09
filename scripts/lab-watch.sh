#!/usr/bin/env bash
# Observação contínua (harness) — sem injetar leader-kill.
set -euo pipefail

WATCH_SEC="${WATCH_SEC:-180}"
POLL_SEC="${POLL_SEC:-5}"
STORAGE_PORT="${STORAGE_HTTP_PORT:-4000}"
NODE_HTTP="${NODE_HTTP:-4002}"
REJECT_BURST_MAX="${REJECT_BURST_MAX:-10}"
NO_COORD_GRACE_SEC="${NO_COORD_GRACE_SEC:-45}"
STALL_SEC="${STALL_SEC:-120}"
STALL_GRACE_SEC="${STALL_GRACE_SEC:-45}"
EXPECT_TX="${EXPECT_TX:-1}"

STORAGE_URL="http://127.0.0.1:${STORAGE_PORT}"
NODE_URL="http://127.0.0.1:${NODE_HTTP}"

curl_json() {
  curl -m 5 -sf "$1" 2>/dev/null || true
}

if ! curl_json "${STORAGE_URL}/v1/health" | grep -q ok; then
  echo "watch: storage indisponível em ${STORAGE_URL}" >&2
  exit 1
fi

start_ts=$(date +%s)
end_ts=$((start_ts + WATCH_SEC))
timeline_after_id=0
last_timeline_growth_ts=$start_ts
last_tx_success_ts=$start_ts
initial_coord=""
success_tx=0
rejected_tx=0
max_consecutive_rejected=0
consecutive_rejected=0
fail_reason=""

echo "==> lab-watch: ${WATCH_SEC}s (sem kill injetado)"

while [[ $(date +%s) -lt $end_ts ]]; do
  now=$(date +%s)
  cluster="$(curl_json "${NODE_URL}/v1/cluster/state")"
  if [[ -n "$cluster" ]]; then
    coord="$(node -e "const o=JSON.parse(process.argv[1]); console.log(o.coordinatorPort??'');" "$cluster" 2>/dev/null || echo "")"
    if [[ -n "$coord" && "$coord" != "null" ]]; then
      [[ -z "$initial_coord" ]] && initial_coord="$coord"
    fi
  fi

  tl="$(curl_json "${STORAGE_URL}/v1/timeline-events?limit=200&afterId=${timeline_after_id}")"
  if [[ -n "$tl" ]]; then
    stats="$(node -e '
const o=JSON.parse(process.argv[1]);
const events=o.events||[];
let maxId=parseInt(process.argv[2],10);
let succ=0,rej=0;
for (const e of events){
  if(e.id>maxId) maxId=e.id;
  const code=(e.event_code||e.eventCode||"").toUpperCase();
  const msg=(e.message||"")+(e.detail||"");
  if(code==="TX_ACK"&&/status=Success/i.test(msg)) succ++;
  if(code==="TX_ACK"&&/status=Rejected/i.test(msg)) rej++;
}
console.log([maxId,succ,rej].join(" "));
' "$tl" "$timeline_after_id" 2>/dev/null || echo "$timeline_after_id 0 0")"
    read -r new_after batch_succ batch_rej <<<"$stats"
    if [[ -n "$new_after" && "$new_after" =~ ^[0-9]+$ && "$new_after" -gt "$timeline_after_id" ]]; then
      timeline_after_id=$new_after
      last_timeline_growth_ts=$now
    fi
    success_tx=$((success_tx + batch_succ))
    rejected_tx=$((rejected_tx + batch_rej))
    if [[ "$batch_succ" -gt 0 ]]; then
      last_tx_success_ts=$now
    fi
    if [[ "$batch_rej" -gt 0 ]]; then
      consecutive_rejected=$((consecutive_rejected + batch_rej))
      [[ "$consecutive_rejected" -gt "$max_consecutive_rejected" ]] && max_consecutive_rejected=$consecutive_rejected
    else
      consecutive_rejected=0
    fi
  fi

  elapsed=$((now - start_ts))
  if [[ "$EXPECT_TX" == "1" && "$elapsed" -gt "$STALL_GRACE_SEC" ]]; then
    if [[ $((now - last_tx_success_ts)) -gt "$STALL_SEC" ]]; then
      fail_reason="sem TX Success na timeline por ${STALL_SEC}s"
      break
    fi
  fi

  sleep "$POLL_SEC"
done

echo ""
echo "==> Relatório watch"
echo "  coordinatorPort inicial=${initial_coord:-?}"
echo "  success_tx=${success_tx} rejected_tx=${rejected_tx}"
echo "  max_rejected_burst=${max_consecutive_rejected}"

ok=1
[[ -z "$initial_coord" ]] && ok=0 && echo "  FALHA: sem coordinatorPort" >&2
if [[ "$EXPECT_TX" == "1" && "$success_tx" -lt 1 ]]; then
  ok=0
  echo "  FALHA: nenhum TX Success" >&2
fi
if [[ "$max_consecutive_rejected" -gt "$REJECT_BURST_MAX" ]]; then
  ok=0
  echo "  FALHA: rajada de Rejected" >&2
fi
[[ -n "$fail_reason" ]] && ok=0 && echo "  FALHA: ${fail_reason}" >&2

if [[ "$ok" == "1" ]]; then
  echo "==> WATCH OK"
  exit 0
fi
echo "==> WATCH FALHOU"
exit 1
