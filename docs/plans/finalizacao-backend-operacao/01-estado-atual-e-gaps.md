# 01 Estado atual e gaps

## Resumo

Inventário do que já existe após o plano [simulacao-lan-ledger](../simulacao-lan-ledger/README.md) e lista fechada de lacunas que este pacote fecha na **fase de implementação** (não nesta fase de escrita).

## Pré-requisitos

- [simulacao-lan-ledger/18-checklist-pronto.md](../simulacao-lan-ledger/18-checklist-pronto.md)
- Código: `src/server/`, `src/storage/`, `docker-compose.yml`, `lab.env`

## O que roda hoje

| Área | Implementação | Observação |
| --- | --- | --- |
| Storage HTTP | `src/storage/`, `schema-ledger.sql`, volume `data/ledger.db` | Primário/standby via discovery HTTP |
| Nós | 4 containers `ubuntu-node-2..5`, anel `CLUSTER_PEERS` | `USE_STORAGE_HTTP=true` via `lab.env` |
| Eleição | `election_round` + `coordinator_announce` + `epoch` | `max(port)` — gap teórico B-CR1 |
| Escrita | `transaction_request` → fila líder → `POST /v1/transactions` | Delta em centavos |
| Simulação | `SimulationRunner`, `SIM_MODE` manual/auto | 1 tx por ciclo por nó; kill default 120s |
| Falhas | `PendingTransactionBuffer`, `storage_down` discard | Join HTTP incompleto |
| Logs | `LabLogger`, flags `LOG_*` parciais | `sim()` ignora algumas flags; ACK em JSON cru |
| HTTP nó | `/v1/state`, `/v1/health`, `/v1/cluster/state` | Sem API de controle PATCH/POST |
| Compose | `docker-compose.yml` + `docker-compose.lan.yml` | Dois arquivos; 4 serviços fixos |
| Join tardio | `BOOTSTRAP_PEER` + `reconnect` Socket | Não usa `GET /v1/cluster/state` no bootstrap |
| Testes | Jest 13 testes, gate compose + npm test | Sem testes kill/discovery/burst |

## Gaps fechados por este plano (implementação futura)

1. **Compose único** orientado a flags (`RING_NODE_COUNT`, storage on/off).
2. **Demo fixa:** `SIM_TX_BURST=2`, intervalo 5s, `auto`, kill 25s.
3. **Logs** correlacionados por `requestId` e flag `LOG_SIM`.
4. **mDNS** (ou equivalente lab) para 2+ PCs sem editar `CLUSTER_PEERS` manualmente.
5. **API controle v1** para o frontend.
6. **Refatoração DDD** leve (`DiscoveryService`, handlers HTTP, política de sim).
7. **Checklist 2 PCs** operacional documentado.
8. Remoção de `docker-compose.lan.yml` após unificação.
9. **Playbook LAN multi-host** (cap. 14) + `lab.env.example` único.
10. **Rediscovery** quando storage host volta (`StorageReachabilityMonitor`).
11. **`GET /v1/cluster/peers`** agregado (opcional v1.1) para front com N hosts.

## Decisões e invariantes

- O modelo **delta + storage atômico** permanece; não introduzir RMW distribuído no follower.
- Descoberta automática é **best-effort lab**; não substitui consenso sob partição de rede.

## Arquivos atuais relevantes

| Path | Papel |
| --- | --- |
| `src/server/application/NodeApplication.js` | Orquestração (candidato a extrair discovery/controle) |
| `src/server/application/SimulationRunner.js` | Carga e kill automático |
| `src/server/infrastructure/logging/LabLogger.js` | Prints |
| `lab.env` / `lab.env.example` | Configuração |
| `docker-compose.yml` | Orquestração local |

## Critérios de aceite (documentação)

- [x] Inventário e gaps listados neste capítulo.
- [ ] Na fase código: cada gap mapeado a uma fase em [12-fases-implementacao-backend.md](12-fases-implementacao-backend.md).

## Riscos

| Risco | Mitigação |
| --- | --- |
| `NodeApplication` monolítico | Cap. 10 define extração incremental |
| mDNS em WSL2/Docker | Cap. 05 documenta host network / advertise IP Wi‑Fi |

## Fora de escopo

- Corrigir B-CR1 (Chang–Roberts literal).
