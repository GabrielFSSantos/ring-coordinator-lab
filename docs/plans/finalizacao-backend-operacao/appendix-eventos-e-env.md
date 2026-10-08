# Appendix — eventos e variáveis

## Resumo

Referência rápida complementando [simulacao-lan-ledger/appendix-payloads-eventos.md](../simulacao-lan-ledger/appendix-payloads-eventos.md).

## Eventos de log (EVENT)

| EVENT | detail exemplo |
| --- | --- |
| `TX_SEND` | `delta=-50.00 req=sim-3003-1` |
| `TX_ENQUEUE` | `req=sim-3003-1` |
| `TX_DEQUEUE` | `req=sim-3003-1` |
| `TX_STORAGE` | `req=sim-3003-1 status=200 balance_after=9950.00` |
| `TX_APPLY` | `req=sim-3003-1 balance=9950.00` |
| `TX_ACK` | `req=sim-3003-1 status=Success` |
| `TX_FAIL` | `req=... err=storage_down` |
| `TX_BUFFER` | `req=...` |
| `KILL_REQUEST` | `pc-a:ubuntu-node-2` |
| `KILL_REJECT` | `election_in_progress` |
| `LEADER_DOWN` | `simulated` |

## Socket.IO (inalterado)

Ver plano LAN appendix: `transaction_request`, `coordinator_announce`, `leader_kill_request`.

## Variáveis novas (resumo)

Compose profiles `local`/`storage`/`nodes`, `RING_NODE_COUNT`, `SIM_TX_BURST`, `DISCOVERY_*`, `LOG_SIM`, `NODE_CONTROL_TOKEN`, `STORAGE_URL_REQUIRED`.

## Eventos storage / LAN

| EVENT | Quando |
| --- | --- |
| `STORAGE_RECOVERED` | Health volta após storage host religar ledger |
| `STORAGE DOWN` | Storage host off ou serviço parado |

Tabela completa de variáveis e efeitos: [16-lab-env-referencia-comportamento.md](16-lab-env-referencia-comportamento.md) · perfis: [04-lab-env-perfis.md](04-lab-env-perfis.md).

## HTTP bodies

Ver [09-api-http-controle-v1.md](09-api-http-controle-v1.md).
