# 17 Simulação LAN e ledger

## Modos

| Modo | Env | Comportamento |
| --- | --- | --- |
| Manual | `SIM_MODE=manual` | Transações periódicas; sem kill automático do líder |
| Auto | `SIM_MODE=auto` | Transações + `leader_kill_request` em `SIM_LEADER_KILL_INTERVAL_MS` |

Defaults demo planejados (após execução do plano de finalização): **2 tx / 5 s por follower**, kill **25 s** — ver [plans/finalizacao-backend-operacao/06-simulacao-carga-e-kill-fixos.md](../plans/finalizacao-backend-operacao/06-simulacao-carga-e-kill-fixos.md).

## Configuração

- [`lab.env`](../../lab.env) — perfil local Docker
- [`lab.env.example`](../../lab.env.example) — template

```bash
source scripts/load-lab-env.sh
```

## Docker local (4 nós + storage)

```bash
docker compose --env-file lab.env up --build --remove-orphans
```

Storage: `http://localhost:4000/v1/balance` · Ledger: `data/ledger.db`

## Planos de execução

| Pacote | Conteúdo |
| --- | --- |
| [simulacao-lan-ledger](../plans/simulacao-lan-ledger/README.md) | Baseline implementado |
| [finalizacao-backend-operacao](../plans/finalizacao-backend-operacao/README.md) | Compose único, mDNS, logs, API controle |
| [console-frontend-lab](../plans/console-frontend-lab/README.md) | Interface web |

## LAN (2 PCs)

Roteiro: [finalizacao-backend-operacao/11-testes-e-gate.md](../plans/finalizacao-backend-operacao/11-testes-e-gate.md) (checklist manual).

## LAN multi-host

1. Todos: `cp lab.env.example lab.env` — mesmo **`STORAGE_URL=http://<IP-do-banco>:4000`** (slide/chat).
2. Cada máquina: `ADVERTISE_HOST`, `LAB_HOST_NAME`, `ADVERTISE_PORT_BASE`, `NODE_COUNT`.
3. Subir: `--profile storage` no PC do banco; `--profile nodes` nos demais (ou `npm run`).
3. Seguir fases 1–4: [14-cenario-lan-multi-host.md](../plans/finalizacao-backend-operacao/14-cenario-lan-multi-host.md).
4. Matriz de cenários: [15-matriz-cenarios-operacao.md](../plans/finalizacao-backend-operacao/15-matriz-cenarios-operacao.md).
5. Referência de cada variável `lab.env`: [16-lab-env-referencia-comportamento.md](../plans/finalizacao-backend-operacao/16-lab-env-referencia-comportamento.md).

Índice de planos: [plans/README.md](../plans/README.md).

## Comandos npm

```bash
cd src
npm run storage   # serviço de ledger
npm run server    # um nó (lab.env)
```

## API

- Storage: `GET /v1/balance`, `GET /v1/ledger`, `POST /v1/transactions` (token; só líder)
- Nó: `GET /v1/state`, `GET /v1/cluster/state` — controle v1 planejado no plano de finalização
