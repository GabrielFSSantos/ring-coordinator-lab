# 07 Estado do frontend e erros

## Resumo

Gerenciamento de estado React, loading e falhas de rede.

## Estado global sugerido

| Slice | Conteúdo |
| --- | --- |
| `balance` | último Balance + `lastUpdated` |
| `ledger` | array entries + `lastId` |
| `nodes` | map port → NodeState |
| `logLines` | string[] circular buffer |
| `ui` | selectedNodePort, applyToAll, pollingPaused |

Hooks: `usePolling(fetcher, intervalMs, enabled)`.

## CORS e proxy

- Dev: sempre proxy Vite para evitar CORS nos nós.
- Storage GET: CORS no backend ou proxy `/api/storage`.

## Cenários de erro

| Situação | UX |
| --- | --- |
| Storage timeout | Banner vermelho; retry exponencial max 30s |
| Nó 404/ECONNREFUSED | Card cinza “offline” |
| PATCH 409 election | Toast amarelo |
| PATCH 401 | “Token controle inválido” |

## LAN

Documentar que operador pode abrir UI no PC-B com storage URL do PC-A; falha comum: firewall → link para cap. 11 backend.

## Critérios de aceite

- [ ] Estados e erros cobrem operação real.

## Fora de escopo

- Offline-first PWA.
