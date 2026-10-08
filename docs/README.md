# Documentação — Ring Coordinator Lab

Entrada na raiz do repositório: [README.md](../README.md).

## Três pilares

| Pasta / arquivo | Papel |
| --- | --- |
| **[documentation/](documentation/README.md)** | Operação, código, fluxos, contratos Socket.IO, testes e gate |
| **[references/](references/README.md)** | PDFs, BibTeX, notas por obra, [mapa literatura↔código](references/mapa_literatura_codigo.md) |
| **[decision-register.md](decision-register.md)** | Decisões de implementação (Postgres, critério de líder, transporte, etc.) |

## Público-alvo

| Leitor | Começar por |
| --- | --- |
| **Operador / aluno (TP)** | [documentation/00_quickstart.md](documentation/00_quickstart.md) → [11_fluxo_ponta_a_ponta.md](documentation/11_fluxo_ponta_a_ponta.md) |
| **Desenvolvedor** | [documentation/13_guia_dev_e_agente.md](documentation/13_guia_dev_e_agente.md) → [14_arquitetura_e_manutencao.md](documentation/14_arquitetura_e_manutencao.md) |
| **Agente (Cursor)** | [documentation/13_guia_dev_e_agente.md](documentation/13_guia_dev_e_agente.md) → [12_invariantes_e_limites.md](documentation/12_invariantes_e_limites.md) → [05_eleicao_em_anel.md](documentation/05_eleicao_em_anel.md) |
| **Banca / professor** | [documentation/16_fundamentacao_bibliografica.md](documentation/16_fundamentacao_bibliografica.md) → [references/README.md](references/README.md) |

**Entrada rápida:** [quickstart](documentation/00_quickstart.md) · [fluxo ponta a ponta](documentation/11_fluxo_ponta_a_ponta.md) · [bibliografia](references/README.md)

**PDFs locais:** [references/pdfs/](references/pdfs/).

**Idioma:** documentação em PT-BR; nomes de código, eventos Socket.IO e paths em inglês como no repositório.

## Manutenção (matriz)

| Tipo de mudança | Onde documentar |
| --- | --- |
| Rede Docker, IPs, portas, healthcheck | [02_infra_docker_compose.md](documentation/02_infra_docker_compose.md), [appendix_variaveis_ambiente.md](documentation/appendix_variaveis_ambiente.md) |
| Eleição, sucessor, critério de líder | [05_eleicao_em_anel.md](documentation/05_eleicao_em_anel.md), [07_contrato_socket_io.md](documentation/07_contrato_socket_io.md) |
| Mutex, fila, gravação | [06_exclusao_mutua_centralizada.md](documentation/06_exclusao_mutua_centralizada.md), [09_persistencia_postgres.md](documentation/09_persistencia_postgres.md) |
| Falha, timeout, reeleição | [10_falhas_e_recuperacao.md](documentation/10_falhas_e_recuperacao.md) |
| Novo evento ou payload | [07_contrato_socket_io.md](documentation/07_contrato_socket_io.md), [appendix_eventos_payloads.md](documentation/appendix_eventos_payloads.md) |
| Decisão de desenho | [decision-register.md](decision-register.md) |
| Lacuna / débito técnico | [engineering_backlog.md](documentation/engineering_backlog.md), [12_invariantes_e_limites.md](documentation/12_invariantes_e_limites.md) |
| Testes e CI local | [15_testes_e_gate.md](documentation/15_testes_e_gate.md) |
| Nova referência / PDF | [bibliografia.bib](references/bibliografia.bib), [references/notas/](references/notas/), [mapa_literatura_codigo.md](references/mapa_literatura_codigo.md) |

Índice da série numerada: [documentation/README.md](documentation/README.md).
