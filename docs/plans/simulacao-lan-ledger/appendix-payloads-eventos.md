# Appendix — payloads

## Socket.IO

### `transaction_request`

```json
{
  "requestId": "req-...",
  "hostName": "notebook-a",
  "nodeName": "ubuntu-node-3",
  "nodePort": 3003,
  "delta": "-50.00",
  "deltaCents": -5000
}
```

Resposta: `transaction_response-{requestId}` → `{ status, data?, error?, reason? }`

### `coordinator_announce`

```json
{ "coordinatorPort": 3005, "epoch": 1730000000000, "processList": [3002,3003,3004,3005] }
```

### `leader_kill_request`

```json
{
  "initiatorHost": "notebook-a",
  "initiatorNode": "ubuntu-node-2",
  "reason": "auto-kill-1",
  "killEpoch": 1730000000000
}
```

## Storage HTTP

`POST /v1/transactions` header `x-storage-token`

```json
{
  "requestId": "req-1",
  "hostName": "h",
  "nodeName": "n",
  "nodePort": 3002,
  "deltaCents": 500
}
```
