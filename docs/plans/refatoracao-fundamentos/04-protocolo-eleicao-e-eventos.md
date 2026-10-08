# 04 Protocolo: eleição e eventos

## Eventos Socket.IO

| Evento | Direção | Payload |
| --- | --- | --- |
| `election_round` | Anel | `number[]` portas participantes |
| `coordinator_announce` | Anel (encadeado) | `{ coordinator, epoch, processList? }` |
| `reconnect` | Qualquer par | `{ port }` |
| `log_request` | Regular → coordenador | `{ requestId, hostname, timestamp }` |
| `log_response-{id}` | Coordenador → regular | `{ status, data?, error?, reason? }` |
| `coordinator_suspect` | Regular → coordenador | sinal de falha (timeout) — inicia reeleição no emissor |

## Boot

- Após `listen`, apenas o nó com **menor** `NODE_PORT` chama `startElection([])` quando o sucessor responde.

## Sem sleeps fixos

- `coordinator_announce` aplicado imediatamente.
- `coordinator_suspect` → `removeCoordinator` + debounce de eleição (500 ms).
- Propagação de líder pelo anel via sucessor.
