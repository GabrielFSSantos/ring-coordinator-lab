# 13 Guia de leitura — desenvolvedor e agente

## 13.1 Público

| Leitor | Objetivo | Rota |
| --- | --- | --- |
| **Dev novo** | Rodar e alterar comportamento | §13.2 → [00_quickstart](00_quickstart.md) → [11_fluxo](11_fluxo_ponta_a_ponta.md) → [14_arquitetura](14_arquitetura_e_manutencao.md) |
| **Agente (Cursor)** | Patch seguro no lab | §13.3 → [12_invariantes](12_invariantes_e_limites.md) → [05_eleicao](05_eleicao_em_anel.md) → [06_mutex](06_exclusao_mutua_centralizada.md) |
| **Banca** | Teoria vs implementação | [16_fundamentacao_bibliografica](16_fundamentacao_bibliografica.md) → [references/README.md](../references/README.md) |

Documentação canônica fica **neste repositório** (`docs/`). Meta-workspace local pode ter harness com gate e `AGENTS.md` — atalho operacional, não segunda fonte de arquitetura.

## 13.2 Roteiro mínimo (dev)

1. [README.md](../../README.md) — visão e comandos
2. [00_quickstart.md](00_quickstart.md)
3. [11_fluxo_ponta_a_ponta.md](11_fluxo_ponta_a_ponta.md)
4. [02_infra_docker_compose.md](02_infra_docker_compose.md)
5. [15_testes_e_gate.md](15_testes_e_gate.md)

## 13.3 Roteiro agente (antes de editar código)

1. Escopo: apenas **ring-coordinator-lab** (não misturar Nexus, Financial Sentiment, etc.).
2. Ler [16_fundamentacao_bibliografica.md](16_fundamentacao_bibliografica.md) e [mapa_literatura_codigo.md](../references/mapa_literatura_codigo.md).
3. Ler [12_invariantes_e_limites.md](12_invariantes_e_limites.md) — o que o sistema afirma.
4. Ler [14_arquitetura_e_manutencao.md](14_arquitetura_e_manutencao.md) — mapa de edição.
5. Mudança em eventos: [07_contrato_socket_io.md](07_contrato_socket_io.md) + [appendix_eventos_payloads.md](appendix_eventos_payloads.md).
6. Decisão de desenho nova: entrada em [decision-register.md](../decision-register.md).
7. Nova referência: [bibliografia.bib](../references/bibliografia.bib) + nota em [references/notas/](../references/notas/).
8. Lacuna encontrada: [engineering_backlog.md](engineering_backlog.md).
9. Gate após mudanças (quando Docker/Node disponíveis):

```bash
# Gate externo: script run-gate.sh no harness do meta-workspace local (fora deste repo)
# Caminho típico no ambiente do autor: harness/checks/run-gate.sh ao abrir workspace ring-coordinator-lab
```

Ou manualmente:

```bash
cd ~/GitHub/ring-coordinator-lab
docker compose config
cd src && npm ci
```

## 13.4 Matriz doc ↔ código (resumo)

| Comportamento | Documentação | Código principal | Teste (futuro) |
| --- | --- | --- | --- |
| Sucessor no anel | [05](05_eleicao_em_anel.md) | `electSuccessor` | mock `ipList` |
| Critério max porta | [05](05_eleicao_em_anel.md) | `startElection` ramo `electionList[0]` | unit |
| Fila mutex | [06](06_exclusao_mutua_centralizada.md) | `addToQueue`, `processRequest` | unit fila |
| Payload log | [appendix_eventos_payloads](appendix_eventos_payloads.md) | `initiateRandomRequests` | contract |
| IP → porta | [08](08_utilitarios.md) | `IpsToObjectSorted` | unit |
| INSERT | [09](09_persistencia_postgres.md) | `processRequest` | integração compose |
| Timeout 10s | [10](10_falhas_e_recuperacao.md) | `initiateRandomRequests` | timer mock |

Suite atual: legada — [15_testes_e_gate.md](15_testes_e_gate.md).

## 13.5 Idioma

- Prosa em `docs/`: **PT-BR**.
- Código, nomes de eventos, env vars: **inglês** como no repo.
