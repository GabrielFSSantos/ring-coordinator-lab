# 07 Trilha de logs estruturados

## Resumo

Especifica formato, eventos obrigatórios e flags para acompanhar o fluxo de escrita **por `requestId`**, equivalente ao que o console web mostrará no painel tipo terminal.

## Pré-requisitos

- [simulacao-lan-ledger/13-logging-prints.md](../simulacao-lan-ledger/13-logging-prints.md) (baseline)
- `LabLogger.js`, `humanLogFormatter.js`

## Formato padrão (`LOG_FORMAT=human`)

Blocos multilinha em **português (BR)** no stdout, um bloco por evento (escrita atômica no processo):

```
── LAB_HOST_NAME │ hostname │ :NODE_PORT │ papel ──
<mensagem legível>
  [EVENT_CODE]
```

`RING_VIEW` usa bloco dedicado (líder, storage, lista de peers).

## Formato estruturado (`LOG_FORMAT=structured`)

Linha única para scripts/UI:

```
ISO8601 | LAB_HOST_NAME | hostname | ROLE | QUEUE | EVENT | detail
```

- `ROLE`: `LEADER` | `FOLLOWER` | `ELECTION` | `STORAGE` | `SIM` | `BOOT`
- `QUEUE`: `-` ou `pos/total` (somente eventos de fila no líder)
- `detail`: key=value preferencial; **sempre** incluir `req=<requestId>` em eventos de transação

## Cadeia de eventos por transação

| Ordem | EVENT | ROLE | Quem emite |
| --- | --- | --- | --- |
| 1 | `TX_SEND` | FOLLOWER | Cliente |
| 2 | `TX_ENQUEUE` | LEADER | Fila aceita |
| 3 | `TX_DEQUEUE` | LEADER | Início processamento |
| 4 | `TX_STORAGE` | LEADER ou STORAGE | HTTP POST ok (status + balance_after) |
| 5 | `TX_APPLY` | LEADER | Sucesso lógico |
| 6 | `TX_ACK` | FOLLOWER | Resposta socket (status=Success) |
| — | `TX_FAIL` / `TX_REJECT` | LEADER/FOLLOWER | Erros |
| — | `TX_BUFFER` | FOLLOWER | Buffer cliente |

Eventos paralelos: `ELECTION_ROUND`, `COORDINATOR_ANNOUNCE`, `COORDINATOR_APPLY`, `RING_VIEW`, `KILL_*`, `STORAGE_DOWN`.

## Flags

| Flag | Eventos |
| --- | --- |
| `LOG_ENABLED` | master |
| `LOG_FORMAT` | `human` (default) ou `structured` |
| `LOG_WRITES` | TX_* exceto SIM |
| `LOG_QUEUE` | ENQUEUE, DEQUEUE com pos/total |
| `LOG_ELECTION` | ELECTION_ROUND, COORDINATOR_*, RING_VIEW |
| `LOG_STORAGE` | STORAGE_*, DISCARD |
| `LOG_READS` | BALANCE, BALANCE_FAIL |
| `LOG_SIM` | KILL_*, LEADER_DOWN |

## Decisões e invariantes

- `LabLogger.sim()` **DEVE** checar `LOG_SIM` e `LOG_ENABLED`.
- `TX_ACK` **DEVE** logar `status` e `req`, não JSON inteiro sem parse.
- Mutex stdout no processo mantido; **multi-container** não garante ordem global — ver [19_convencoes_codigo_e_logs.md](../../documentation/19_convencoes_codigo_e_logs.md).

## Agregação futura (console)

Opcional fase 2 backend: `GET /v1/events` ring buffer no nó — **fora da v1**; front usa polling ledger + state + derivar linhas (appendix front).

## Arquivos alvo

| Path |
| --- |
| `src/server/infrastructure/logging/LabLogger.js` |
| `src/server/infrastructure/logging/humanLogFormatter.js` |
| `src/server/application/NodeApplication.js` (pontos de log) |

## Critérios de aceite

- [x] `LOG_SIM=false` silencia kill.
- [x] `LOG_FORMAT=human` emite PT-BR; `structured` mantém linha única.
- [ ] Documentação alinhada a [appendix-eventos-e-env.md](appendix-eventos-e-env.md).

## Riscos

| Risco | Mitigação |
| --- | --- |
| Terminal intercalado | Doc: usar `docker compose logs` por serviço ou UI |

## Fora de escopo

- ELK, Loki, OpenTelemetry.
