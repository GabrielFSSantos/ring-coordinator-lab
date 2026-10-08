# Documentação técnica — Ring Coordinator Lab

Referência para **Docker**, **código Node.js**, **eleição**, **mutex centralizado** e **PostgreSQL**. Teoria de curso: [references/](../references/README.md). Decisões: [decision-register.md](../decision-register.md).

## Ordem sugerida

| # | Arquivo | Conteúdo |
| --- | --- | --- |
| 0 | [00_quickstart.md](00_quickstart.md) | Subir ambiente, logs, SQLite, verificar gravações |
| 1 | [01_visao_e_conceitos_sd.md](01_visao_e_conceitos_sd.md) | Glossário, componentes, objetivos do TP |
| 2 | [02_infra_docker_compose.md](02_infra_docker_compose.md) | Topologia, serviços, rede, volumes |
| 3 | [03_entrypoints_e_build.md](03_entrypoints_e_build.md) | `main.js`, Dockerfile, ciclo de vida |
| 4 | [04_modulo_distributed_node.md](04_modulo_distributed_node.md) | Estado e métodos da classe `DistributedNode` |
| 5 | [05_eleicao_em_anel.md](05_eleicao_em_anel.md) | Anel lógico, `election_round`, `coordinator_announce`, critério de líder |
| 6 | [06_exclusao_mutua_centralizada.md](06_exclusao_mutua_centralizada.md) | Fila, serialização, INSERT |
| 7 | [07_contrato_socket_io.md](07_contrato_socket_io.md) | Tabela de eventos e efeitos |
| 8 | [08_utilitarios.md](08_utilitarios.md) | `utils/*` |
| 9 | [09_persistencia_sqlite.md](09_persistencia_sqlite.md) | Schema, SQLite, inspeção |
| 10 | [10_falhas_e_recuperacao.md](10_falhas_e_recuperacao.md) | Timeouts, `Disconnect`, `reconnect` |
| 11 | [11_fluxo_ponta_a_ponta.md](11_fluxo_ponta_a_ponta.md) | Timeline única do sistema |
| 12 | [12_invariantes_e_limites.md](12_invariantes_e_limites.md) | O que o TP afirma vs limitações |
| 13 | [13_guia_dev_e_agente.md](13_guia_dev_e_agente.md) | Rotas dev/agente, gate |
| 14 | [14_arquitetura_e_manutencao.md](14_arquitetura_e_manutencao.md) | Onde editar cada comportamento |
| 15 | [15_testes_e_gate.md](15_testes_e_gate.md) | Jest legado, gate, plano de testes |
| 16 | [16_fundamentacao_bibliografica.md](16_fundamentacao_bibliografica.md) | Código + teoria + PDFs; roteiro banca |
| 19 | [19_convencoes_codigo_e_logs.md](19_convencoes_codigo_e_logs.md) | Inglês no código, PT-BR nos logs, wire Socket.IO |
| — | [appendix_eventos_payloads.md](appendix_eventos_payloads.md) | Exemplos JSON |
| — | [appendix_variaveis_ambiente.md](appendix_variaveis_ambiente.md) | Env vars por nó |
| — | [engineering_backlog.md](engineering_backlog.md) | Débitos técnicos |

Índice geral: [docs/README.md](../README.md).
