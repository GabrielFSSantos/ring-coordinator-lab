# Ring Coordinator Lab

Simulação de **eleição em anel**, **mutex centralizado** e **ledger** (saldo compartilhado) com storage HTTP.

## Documentação

- [docs/README.md](docs/README.md)
- [Simulação LAN + ledger](docs/documentation/17_simulacao_lan_ledger.md)
- [Dois PCs em casa (8 nós)](docs/documentation/18_lan_dois_pcs_casa.md)
- Variáveis: [lab.env.example](lab.env.example)

## Um `lab.env` para todos

1. `cp lab.env.example lab.env`
2. Em LAN: todos usam o **mesmo** `STORAGE_URL` (IP do PC do banco, passado no slide/chat).
3. Cada pessoa ajusta só: `ADVERTISE_HOST`, `LAB_HOST_NAME`, `ADVERTISE_PORT_BASE`, `NODE_COUNT`.

| Modo | Comando |
| --- | --- |
| **Docker local** (4 nós + banco) | `docker compose --profile local --env-file lab.env up --build` ou `./scripts/lan-up.sh local` |
| **LAN — só banco** | `docker compose --profile storage --env-file lab.env up --build` |
| **LAN — só nós** | `docker compose --profile nodes --env-file lab.env up --build` |
| **LAN — banco + nós** | `docker compose --profile storage --profile nodes --env-file lab.env up --build` |
| **npm (sem Docker)** | `cd src && npm run storage` (banco) · `npm run server` (nó) |

Docker local: `lab.env` na raiz já aponta para `172.25.0.10` e `DISCOVERY_MODE=off`.

- Nós: portas `3002`–`3005`
- Storage: `http://localhost:4000` · `GET /v1/balance`
- Dados: `data/ledger.db` (com `LEDGER_RESET_ON_START=true`, cada boot do storage zera timeline e saldo inicial)

## Ver o lab no terminal

No **Docker local**, `compose up` mostra só linhas **`[lab-ops]`** (subida/erro por container). O **`lab-tail`** roda em segundo plano (`attach: false`) e não repete a narrativa no mesmo terminal.

```bash
docker compose --profile local --env-file lab.env up --build   # ops + status Docker
docker compose --profile local logs -f lab-tail                 # narrativa global (PC · nó · papel)
```

Defina `LAB_HOST_NAME` no `lab.env` de cada PC para distinguir máquinas na LAN.

Sem Docker: `cd src && npm run tail` (com `STORAGE_URL` e `LOG_STDOUT_MODE=timeline_all` no `lab.env`).

Ajustes visuais: `LOG_STYLE=box`, `LOG_DETAIL=false`, `LOG_TX_STORY=true`. Detalhes: [docs/documentation/19_convencoes_codigo_e_logs.md](docs/documentation/19_convencoes_codigo_e_logs.md).

Carga simulada orgânica: **1 tx por ciclo** por nó, intervalos distintos no compose (10 s / 5 s / 8 s / 7 s) — melhor leitura no `lab-tail`. Ajuste em runtime: `PATCH /v1/simulation` com `txIntervalSec`.

## Testes

```bash
cd src && npm ci && npm test
```

Gate: `~/GitHub/Workspaces/ring-coordinator-lab/harness/checks/run-gate.sh`
