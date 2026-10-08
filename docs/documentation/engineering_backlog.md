# Engineering backlog

Débitos técnicos conhecidos. Itens resolvidos na refatoração **fundamentos** (2026-10-08) estão listados em [plans/refatoracao-fundamentos/backlog-mapeamento.md](../plans/refatoracao-fundamentos/backlog-mapeamento.md).

## Abertos

| ID | Item | Impacto | Referência alvo | Doc |
| --- | --- | --- | --- | --- |
| B-CR1 | Lista na `election_round` vs mensagem com max UID (Chang–Roberts) | Gap teórico principal | `chang1979extrema` | [05](05_eleicao_em_anel.md) |
| B-LAN1 | Descoberta mDNS + merge membership (LAN) | Operação 2+ PCs sem `CLUSTER_PEERS` manual | Plano finalização | [plans/finalizacao-backend-operacao/05-descoberta-lan-automatica.md](../plans/finalizacao-backend-operacao/05-descoberta-lan-automatica.md) |
| B-LAN2 | Compose único orientado a `lab.env` | Um fluxo Docker/LAN | Plano finalização | [plans/finalizacao-backend-operacao/03-compose-unico-e-flags.md](../plans/finalizacao-backend-operacao/03-compose-unico-e-flags.md) |
| B-UI-API | API HTTP controle v1 nos nós (sim, pause, kill) | Console web | Plano finalização | [plans/finalizacao-backend-operacao/09-api-http-controle-v1.md](../plans/finalizacao-backend-operacao/09-api-http-controle-v1.md) |
| B-UI-CONSOLE | SPA ledger + log + comandos | Didática TP | Plano frontend | [plans/console-frontend-lab/README.md](../plans/console-frontend-lab/README.md) |
| B-LAN-PLAYBOOK | Playbook LAN + `lab.env.example` único + profiles compose + P9 | LAN Wi‑Fi / N hosts | Plano finalização | [plans/finalizacao-backend-operacao/14-cenario-lan-multi-host.md](../plans/finalizacao-backend-operacao/14-cenario-lan-multi-host.md) |

## Resolvidos (referência)

B1, B2, B3, B4, B5, B6, B7, B8, B9, B10, B11, B12, B-ELEC1, B-MUTEX1 — ver mapeamento no plano de refatoração.

Priorização futura opcional: **B-CR1** (anexo Chang–Roberts-lite) se quiser convergência bibliográfica total.
