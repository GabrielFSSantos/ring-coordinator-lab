# Plano: finalização backend e operação LAN

Pacote de **contrato de implementação** para fechar o backend do lab antes do console web: compose único, simulação demo fixa, logs correlacionados, descoberta LAN automática (mDNS) e API HTTP de controle v1 para o frontend.

**Esta pasta é documentação.** A execução (código) ocorre em fases descritas em [12-fases-implementacao-backend.md](12-fases-implementacao-backend.md).

## Pré-requisitos de leitura

1. [documentation/13_guia_dev_e_agente.md](../../documentation/13_guia_dev_e_agente.md)
2. [documentation/14_arquitetura_e_manutencao.md](../../documentation/14_arquitetura_e_manutencao.md)
3. [documentation/17_simulacao_lan_ledger.md](../../documentation/17_simulacao_lan_ledger.md)
4. Plano anterior (baseline): [simulacao-lan-ledger/README.md](../simulacao-lan-ledger/README.md)

## Gate (após implementação)

```bash
~/GitHub/Workspaces/ring-coordinator-lab/harness/checks/run-gate.sh
```

Evolução esperada do gate: `docker compose --env-file lab.env config` (ver [11-testes-e-gate.md](11-testes-e-gate.md)).

## Índice

| # | Capítulo |
| --- | --- |
| 01 | [estado-atual-e-gaps.md](01-estado-atual-e-gaps.md) |
| 02 | [escopo-nao-escopo-backend.md](02-escopo-nao-escopo-backend.md) |
| 03 | [compose-unico-e-flags.md](03-compose-unico-e-flags.md) |
| 04 | [lab-env-perfis.md](04-lab-env-perfis.md) |
| 05 | [descoberta-lan-automatica.md](05-descoberta-lan-automatica.md) |
| 06 | [simulacao-carga-e-kill-fixos.md](06-simulacao-carga-e-kill-fixos.md) |
| 07 | [trilha-logs-estruturados.md](07-trilha-logs-estruturados.md) |
| 08 | [caminho-escrita-leitura-invariantes.md](08-caminho-escrita-leitura-invariantes.md) |
| 09 | [api-http-controle-v1.md](09-api-http-controle-v1.md) |
| 10 | [arquitetura-ddd-solid.md](10-arquitetura-ddd-solid.md) |
| 11 | [testes-e-gate.md](11-testes-e-gate.md) |
| 12 | [fases-implementacao-backend.md](12-fases-implementacao-backend.md) |
| 13 | [checklist-aceite-backend.md](13-checklist-aceite-backend.md) |
| 14 | [cenario-lan-multi-host.md](14-cenario-lan-multi-host.md) |
| 15 | [matriz-cenarios-operacao.md](15-matriz-cenarios-operacao.md) |
| 16 | [lab-env-referencia-comportamento.md](16-lab-env-referencia-comportamento.md) |
| — | [appendix-eventos-e-env.md](appendix-eventos-e-env.md) |

## Cenário LAN multi-host

Roteiro operacional (storage central + N participantes na mesma rede): **[14-cenario-lan-multi-host.md](14-cenario-lan-multi-host.md)**.

Template: [lab.env.example](../../../lab.env.example)

Referência de variáveis: **[16-lab-env-referencia-comportamento.md](16-lab-env-referencia-comportamento.md)**.

| Compose profile | Uso |
| --- | --- |
| `local` | 1 PC, 4 nós + storage (casa) |
| `storage` | Só ledger na LAN |
| `nodes` | Só nós (`STORAGE_URL` fixo no env) |

## Relação com `simulacao-lan-ledger`

| Item | Status |
| --- | --- |
| Storage HTTP, ledger, `transaction_request`, `PendingTransactionBuffer`, `LabLogger` base | **Herdado** — manter |
| `docker-compose.lan.yml` separado | **Obsoleto** — remover na execução; unificar em [03-compose-unico-e-flags.md](03-compose-unico-e-flags.md) |
| Capítulos 01–02, 05–17 stubs no plano LAN | **Substituído** por este pacote; stubs ganham link “continuação” no README LAN |
| Join só `BOOTSTRAP_PEER` + Socket | **Substituído** por discovery mDNS + merge (cap. 05) |
| Taxa sim / kill via env genérico | **Evoluído** — defaults demo 2 tx/5s/nó, kill 25s (cap. 06) |
| API só leitura no nó | **Evoluído** — API controle v1 (cap. 09) |

## Decisões fixadas (produto)

| Tópico | Decisão |
| --- | --- |
| Compose | Um único `docker-compose.yml` + `lab.env` |
| Demo | Por follower: 2 escritas / 5 s; kill líder / 25 s em `auto` |
| Saldo | Delta no cliente; apply atômico no storage; líder serializa |
| LAN | Descoberta automática (mDNS lab); fallback manual |

## Decisão registrada (rascunho)

**DR-008** — texto completo em [05-descoberta-lan-automatica.md](05-descoberta-lan-automatica.md#dr-008-rascunho). Copiar para [decision-register.md](../../decision-register.md) na fase de código.

## Console frontend

Plano dependente: [console-frontend-lab/README.md](../console-frontend-lab/README.md).
