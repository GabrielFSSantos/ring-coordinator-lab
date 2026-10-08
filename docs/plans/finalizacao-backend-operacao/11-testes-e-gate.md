# 11 Testes e gate

## Resumo

Testes automatizados novos, evolução do gate no harness e **roteiro manual** para validação com 2 PCs na Wi‑Fi.

## Pré-requisitos

- [documentation/15_testes_e_gate.md](../../documentation/15_testes_e_gate.md)
- [13-checklist-aceite-backend.md](13-checklist-aceite-backend.md)

## Jest (novos casos)

| Suite | Caso |
| --- | --- |
| `SimulationPolicy.test.js` | burst=2, intervalo mínimo |
| `SimulationRunner.test.js` | mock node; não dispara tx se coordinator |
| `LeaderKill.test.js` | rejeita se `inElection` |
| `DiscoveryMerge.test.js` | merge peers dedup por porta |
| `LabLogger.test.js` | `LOG_SIM` desliga eventos |

Manter `--maxWorkers=1` (better-sqlite3).

## Gate (`harness/checks/run-gate.sh`)

Alteração planejada:

```bash
docker compose --env-file "$REPO/lab.env" -f "$REPO/docker-compose.yml" config >/dev/null
```

Documentar em harness; não alterar código do produto nesta meta-fase.

## Smoke local (1 máquina)

```bash
docker compose --env-file lab.env up -d --build
curl -s http://localhost:4000/v1/balance
curl -s http://localhost:4002/v1/state
docker compose logs ubuntu-node-3 | grep TX_SEND | tail
```

## Checklist manual 2 PCs (Wi‑Fi)

### Pré-requisitos rede

- [ ] PCs na mesma sub-rede Wi‑Fi
- [ ] Firewall: TCP 3002–3010 (ajustar), 4000, UDP 5353
- [ ] Anotar IP Wi‑Fi PC-A e PC-B

### PC-A (storage + pelo menos 1 nó)

1. Copiar `lab.env.example` → `lab.env`
2. `ADVERTISE_HOST=<IP-WiFi-A>`, `STORAGE_MODE=primary`, `DISCOVERY_MODE=mdns`, `LAB_HOST_NAME=pc-a`
3. `docker compose --env-file lab.env up --build` (perfil com storage)
4. `curl http://<IP-A>:4000/v1/balance` → JSON ok

### PC-B (nós apenas)

1. `STORAGE_MODE=none`, `DISCOVERY_MODE=mdns`, `ADVERTISE_HOST=<IP-WiFi-B>`, `STORAGE_URL` vazio ou apontando A
2. Subir compose perfil `lan-node` / `NODE_COUNT` conforme cap. 03
3. Aguardar 30s discovery
4. `curl http://<IP-B>:<NODE_HTTP>/v1/cluster/state` → peers incluem A e B
5. Verificar `GET /v1/ledger` no A: entradas `txn` de ambos hosts

### Falha esperada documentada

- Storage down no A → B rejeita/descarta conforme flags; recuperar ao subir A.

## Checklist LAN multi-host (mínimo: 1 storage host + 2 participants)

Seguir [14-cenario-lan-multi-host.md](14-cenario-lan-multi-host.md) Fases 1–4.

- [ ] PC do banco: `--profile storage`, ledger na LAN `:4000`
- [ ] Demais PCs: mesmo `STORAGE_URL` no `lab.env` (copiado de `lab.env.example`)
- [ ] Fase 1: participants sem storage alcançável → logs `storage_down` / descarte
- [ ] Fase 2: storage host sobe → ledger ganha `txn` de vários `LAB_HOST_NAME`
- [ ] Fase 3: storage host para → descarte volta; anel entre participants continua
- [ ] Fase 4: storage religa → novas txs persistem (antigas não)

### Escala N hosts (opcional)

- [ ] `NODE_COUNT=1` por host; roteador sem AP isolation; mDNS estável

## Atualizações documentais (fase código)

| Arquivo | Ação |
| --- | --- |
| [docs/README.md](../../README.md) | Linhas planos `finalizacao-backend-operacao`, futuro `18_console_lab.md` |
| [17_simulacao_lan_ledger.md](../../documentation/17_simulacao_lan_ledger.md) | Link pacote; `--env-file` |
| [engineering_backlog.md](../../documentation/engineering_backlog.md) | B-LAN1 discovery, B-LAN2 compose único, B-UI-API |
| [harness/AGENTS.md](file:///home/gabrielfssantos/GitHub/Workspaces/ring-coordinator-lab/harness/AGENTS.md) | Ler pacote antes de implementar |
| [harness/architecture/ring-election-and-centralized-mutex.md](file:///home/gabrielfssantos/GitHub/Workspaces/ring-coordinator-lab/harness/architecture/ring-election-and-centralized-mutex.md) | Postgres → storage HTTP |

## Critérios de aceite

- [ ] Roteiro 2 PCs executável sem ambiguidade.
- [ ] Gate documentado com env-file.

## Fora de escopo

- CI GitHub Actions (opcional futuro).
