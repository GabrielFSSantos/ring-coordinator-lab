# 19 Convenções de código e logs

## Regra geral

| Camada | Idioma |
| --- | --- |
| Código em `src/` (identificadores, eventos wire, códigos `EVENT`) | **Inglês** |
| Mensagens no stdout para operação humana | **Português (BR)** |
| Documentação em `docs/documentation/` | **Português (BR)** (nomes técnicos wire em inglês) |

## Socket.IO (wire)

Definidos em [`src/server/domain/protocol/socketEvents.js`](../../src/server/domain/protocol/socketEvents.js).

| Evento | Uso |
| --- | --- |
| `election_round` | Lista de portas circulando no anel |
| `coordinator_announce` | Líder eleito (`coordinatorPort`, `epoch`) |
| `reconnect` | Peer voltou ao anel |
| `transaction_request` | Cliente → líder |
| `coordinator_suspect` | Timeout / suspeita de falha do líder |

Contrato: [07_contrato_socket_io.md](07_contrato_socket_io.md).

## Códigos de log (`EVENT`)

Inglês e estáveis (grep, `LOG_FORMAT=structured`). Exemplos: `TX_ENQUEUE`, `ELECTION_ROUND`, `ELECTION_HEARD`, `ELECTION_PASS`, `COORDINATOR_APPLY`, `RING_VIEW`.

Eleição no `lab-tail`: ouvir (`ELECTION_HEARD`) → iniciar rodada (`ELECTION_ROUND`) → repassar anel (`ELECTION_PASS`) → anúncio/aplicação do coordenador → `LEADER_UP` / `COORD_CONNECT`. Transações: `TX_SEND` → passos do líder (`TX_ENQUEUE` … `TX_STORAGE`) → `TX_ACK`.

Renderização humana: [`humanLogFormatter.js`](../../src/server/infrastructure/logging/humanLogFormatter.js) + caixas em [`logBoxRenderer.js`](../../src/server/infrastructure/logging/logBoxRenderer.js).

## Variáveis de ambiente (visual)

| Variável | Default | Efeito |
| --- | --- | --- |
| `LOG_FORMAT` | `human` | Narrativa PT-BR vs linha estruturada |
| `LOG_STYLE` | `box` | Caixas Unicode com título colorido por porta |
| `LOG_DETAIL` | `false` | Oculta `[EVENT]` e ids técnicos no texto |
| `LOG_TX_STORY` | `true` | Uma caixa por transação no coordenador |
| `LOG_RING_VIEW_INTERVAL_MS` | `0` | Sem resumo periódico; só quando o estado muda |
| `LOG_TIMELINE_PERSIST` | `true` | Grava eventos em `timeline_events` no storage |
| `LOG_TIMELINE_SKIP_CODES` | (vazio) | CSV extra; padrão já ignora `RING_VIEW` e `TX_STORY` |
| `LOG_STDOUT_MODE` | `direct` | `direct` = imprime no processo; `off` = silencioso; `timeline_self` / `timeline_all` = poll no storage |
| `LOG_TIMELINE_POLL_MS` | `400` | Intervalo do poller quando stdout vem da timeline |
| `LOG_DOCKER_OPS` | auto | `true` quando `LOG_STDOUT_MODE≠direct` — linhas `[lab-ops]` no stderr (compose up) |
| `LAB_HOST_NAME` | host | Nome do **PC** no título das caixas (`pc-sala-a · ubuntu-node-2 · …`) |

Timeout de transação: preferir `REQUEST_TIMEOUT_MS`; `TIMEOUT_LIMIT` é alias legado.

### Stdout vs timeline

| Modo | Uso |
| --- | --- |
| `direct` | Um processo isolado (`npm run server`) — comportamento clássico |
| `off` | Só grava na timeline; compose local nos nós |
| `timeline_all` | Serviço `lab-tail` ou `npm run tail` — narrativa global ordenada |
| `timeline_self` | Cada nó imprime só eventos da própria identidade (`lab_host_name` + `node_name` + `node_port`), consumindo o cursor global |

Requer `LOG_TIMELINE_PERSIST=true` e `STORAGE_URL` para modos `timeline_*`.

## Reset do ledger (demo)

| Variável | Default | Efeito |
| --- | --- | --- |
| `LEDGER_RESET_ON_START` | `true` | No boot do storage primário: limpa `timeline_events` e `ledger_entries` e restaura saldo inicial |

LAN com histórico: `LEDGER_RESET_ON_START=false`.

## Timeline persistida (multi-PC)

- **Leitura:** `GET /v1/timeline-events?limit=100&afterId=<último id>`
- **Escrita:** cada nó faz `POST /v1/timeline-events` (token igual ao do líder; **não** altera saldo).
- **Ledger** (`GET /v1/ledger`) permanece só para movimentações contábeis (`txn` / `admin`).
- PC que entra depois: mesmo `STORAGE_URL` → histórico completo paginando desde `afterId=0`.

## Exemplo de caixa (`LOG_FORMAT=human`, `LOG_STYLE=box`)

```
┌ docker-lab · ubuntu-node-3 · participante ─────────────────────────────┐
│ ubuntu-node-3 pediu uma movimentação de −R$ 12,50.                  │
└──────────────────────────────────────────────────────────────────────┘

```

## Terminal no Docker local

- **`compose up`:** stderr `[lab-ops]` por nó/storage; `lab-tail` com `attach: false` (não mistura caixas).
- **Narrativa:** `docker compose --profile local logs -f lab-tail` (poll global; latência ≈ `LOG_TIMELINE_POLL_MS`).
- **`compose down`:** mensagens padrão do Docker (Stopping/Removed).

Para depuração com stdout direto no nó: `LOG_STDOUT_MODE=direct` no serviço.

## Referências

- [07-trilha-logs-estruturados.md](../plans/finalizacao-backend-operacao/07-trilha-logs-estruturados.md)
- [lab.env.example](../../lab.env.example)
