# 15 Matriz de cenários operação

## Resumo

Tabela de referência rápida: combinações de storage, anel, líder e efeito nas transações — testes, operação LAN e frontend.

## Pré-requisitos

- [14-cenario-lan-multi-host.md](14-cenario-lan-multi-host.md)
- [08-caminho-escrita-leitura-invariantes.md](08-caminho-escrita-leitura-invariantes.md)

## Decisões e invariantes

- Persistência **só** quando líder consegue `POST` no storage saudável.
- Eleição **independente** de storage (pode haver líder com storage down).

## Matriz principal

| # | Storage primário | Peers / anel | Líder | Follower envia tx | Efeito no ledger | Anel / eleição |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Off / inalcançável | Só participants | Qualquer | Sim | **Descarta** `storage_down` | Continua |
| 2 | Off | Participants + storage-host (sem storage up) | Qualquer | Sim | Descarta | Continua |
| 3 | On | Completo | Eleito | Sim | **Persiste** | Normal |
| 4 | On → Off (Fase 3) | Participants | Mantido até suspeita | Sim | Descarta após down | Pode reeleger se líder cair |
| 5 | Off → On (Fase 4) | Completo | Pode mudar | Sim | Novas txs persistem | Normal |
| 6 | On | Storage-host offline total | — | — | Indisponível | Participants como linha 1 |
| 7 | On | Join tardio (mDNS) | Reeleição possível | Sim | Persiste se storage ok | Merge peers |
| 8 | Standby (2º host storage) | LAN | Um primário | Sim | Só primário escreve | Doc standby DR-007 |

## Matriz por papel do host

| Papel | `STORAGE_MODE` | `STORAGE_URL` | Sobe container storage |
| --- | --- | --- | --- |
| Storage host | `primary` | `http://<self>:4000` | Sim |
| Participant host | `none` | `http://<storage-host>:4000` | Não |

## Simulação: LAN manual vs demo local

| Variável | LAN / apps reais | Demo casa (`lab.env` local) |
| --- | --- | --- |
| `SIM_MODE` | `manual` | `auto` |
| `SIM_LEADER_KILL_*` | ignorado / off | 25s interval |
| `SIM_TX_BURST` | 1–2 (baixo) | 2 |
| `SIM_TX_INTERVAL_MS` | ≥ 5000 | 5000 |

## Eventos de log esperados (implementação)

| Transição | EVENT planejado |
| --- | --- |
| storage falha | `STORAGE DOWN` |
| storage volta | `STORAGE_RECOVERED` |
| tx rejeitada | `TX_FAIL`, `DISCARD` |
| novo líder | `coordinator_announce`, `LEADER_UP` |

## Extensão opcional ledger (histórico líder / cluster)

Não bloqueante para MVP backend:

```sql
-- Opção A: entry_type adicional
-- leader_elected: host_name, node_port, epoch em message JSON

-- Opção B: tabela leader_epochs (id, epoch, host_name, node_port, elected_at_ms)
```

Frontend v1: derivar de polling `coordinatorPort` em `/v1/state` de todos os nós + entradas `admin` no ledger.

## API opcional v1.1 (LAN + front)

| Rota | Uso |
| --- | --- |
| `GET /v1/cluster/peers` | Lista merge estático + mDNS |
| `GET /v1/storage/status` | `{ up, url, lastCheckMs }` no nó |

## Critérios de aceite

- [x] Cenários 1–8 cobertos.
- [ ] Testes manuais em [11-testes-e-gate.md](11-testes-e-gate.md) referenciam linhas da matriz.

## Fora de escopo

- Partição de rede com dois líderes gravando (split-brain storage).
