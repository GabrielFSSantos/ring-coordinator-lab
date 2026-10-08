# Referências bibliográficas — Ring Coordinator Lab

Índice para ancorar **eleição em anel**, **mutex centralizado** e **falhas** na implementação. BibTeX: [bibliografia.bib](bibliografia.bib). Mapa código ↔ fonte: [mapa_literatura_codigo.md](mapa_literatura_codigo.md).

Convenção de arquivo: `autor_ano_slug-do-titulo.ext` (minúsculas, underscores, um arquivo por obra). PDFs em [pdfs/](pdfs/).

## Quatro referências âncora

| # | Referência | Uso no lab | PDF local |
| --- | --- | --- | --- |
| 1 | **Chang & Roberts (1979)** — eleição em anel | Comparar com `election_round` / `startElection` | [pdfs/chang_roberts_1979_extrema_finding_ring_election.pdf](pdfs/chang_roberts_1979_extrema_finding_ring_election.pdf) · [nota](notas/chang1979_ring_election.md) |
| 2 | **Garcia-Molina (1982)** — eleições / bully | Coordenador, reeleição após falha | [pdfs/garcia_molina_1982_elections_in_distributed_system.pdf](pdfs/garcia_molina_1982_elections_in_distributed_system.pdf) · [nota](notas/garcia1982_bully.md) |
| 3 | **Velazquez (1993)** — survey mutex distribuído | Enquadrar mutex **centralizado** (fila no líder) | [pdfs/velazquez_1993_survey_distributed_mutual_exclusion.pdf](pdfs/velazquez_1993_survey_distributed_mutual_exclusion.pdf) · [nota](notas/velazquez1993_mutex_survey.md) |
| 4 | **Tanenbaum & van Steen** — *Distributed Systems* (4ª ed.) | Visão geral, coordenação, falhas | [pdfs/van_steen_tanenbaum_distributed_systems_4ed.pdf](pdfs/van_steen_tanenbaum_distributed_systems_4ed.pdf) · [nota](notas/tanenbaum2023_ds4.md) |

## Referências de suporte

| Referência | Uso | Acesso |
| --- | --- | --- |
| Le Lann (1977) IFIP | Eleição em anel O(n²); contexto histórico | [pdfs/le_lann_1977_ifip_distributed_systems_formal_approach.pdf](pdfs/le_lann_1977_ifip_distributed_systems_formal_approach.pdf) · [nota](notas/lelann1977_link_only.md) |
| UT Austin — notas LCR | LeLann + Chang–Roberts, complexidade | [pdfs/utexas_cs380d_lcr_ring_election_notes.pdf](pdfs/utexas_cs380d_lcr_ring_election_notes.pdf) · [nota](notas/utexas_lcr_election_notes.md) |
| DTU (2017) — *Distributed Elections* | Mensagem `elected` vs nosso `coordinator_announce` | [pdfs/dtu_2017_distributed_elections_slides.pdf](pdfs/dtu_2017_distributed_elections_slides.pdf) · [nota](notas/dtu2017_distributed_elections.md) |
| Garcia-Molina & Barbara (1985) — votos | Partição; limite do lab | [pdfs/garcia_molina_barbara_1985_how_to_assign_votes.pdf](pdfs/garcia_molina_barbara_1985_how_to_assign_votes.pdf) · [nota](notas/garcia1985_votes.md) |
| Ongaro & Ousterhout (2014) — Raft | Contraste: quorum vs anel ad hoc | [pdfs/ongaro_ousterhout_2014_raft_understandable_consensus.pdf](pdfs/ongaro_ousterhout_2014_raft_understandable_consensus.pdf) · [nota](notas/ongaro2014_raft.md) |
| MIT 6.824 — notas Raft | Termos, eleição com maioria | [pdfs/mit_6824_raft_lecture_notes.txt](pdfs/mit_6824_raft_lecture_notes.txt) · [nota](notas/mit6824_raft_notes.md) |

## Link only

| Referência | Nota |
| --- | --- |
| Lynch (1996) *Distributed Algorithms* | [notas/lynch1996_link_only.md](notas/lynch1996_link_only.md) |

## Índices temáticos curtos

| Arquivo | Aponta para |
| --- | --- |
| [notas/eleicao_em_anel.md](notas/eleicao_em_anel.md) | Chang–Roberts, Le Lann, UT, DTU |
| [notas/mutex_centralizado.md](notas/mutex_centralizado.md) | Velazquez, Tanenbaum |
| [notas/detecao_de_falhas.md](notas/detecao_de_falhas.md) | Garcia 1982, Raft (contraste) |

## Status dos PDFs locais (`pdfs/`)

| Arquivo | Status |
| --- | --- |
| `chang_roberts_1979_extrema_finding_ring_election.pdf` | OK |
| `garcia_molina_1982_elections_in_distributed_system.pdf` | OK |
| `velazquez_1993_survey_distributed_mutual_exclusion.pdf` | OK |
| `van_steen_tanenbaum_distributed_systems_4ed.pdf` | OK |
| `le_lann_1977_ifip_distributed_systems_formal_approach.pdf` | OK |
| `utexas_cs380d_lcr_ring_election_notes.pdf` | OK |
| `dtu_2017_distributed_elections_slides.pdf` | OK |
| `garcia_molina_barbara_1985_how_to_assign_votes.pdf` | OK |
| `ongaro_ousterhout_2014_raft_understandable_consensus.pdf` | OK |
| `mit_6824_raft_lecture_notes.txt` | OK |

## Mapa referência → documentação

| Referência (nota) | Capítulo documentation |
| --- | --- |
| Chang (1979) | [05_eleicao_em_anel](../documentation/05_eleicao_em_anel.md), [comparacao_algoritmos](comparacao_algoritmos.md) |
| Garcia (1982) | [10_falhas_e_recuperacao](../documentation/10_falhas_e_recuperacao.md), [05_eleicao](../documentation/05_eleicao_em_anel.md) |
| Velazquez (1993) | [06_exclusao_mutua_centralizada](../documentation/06_exclusao_mutua_centralizada.md) |
| Tanenbaum (2023) | [01_visao_e_conceitos_sd](../documentation/01_visao_e_conceitos_sd.md), [16_fundamentacao_bibliografica](../documentation/16_fundamentacao_bibliografica.md) |
| Ongaro (2014) | [12_invariantes_e_limites](../documentation/12_invariantes_e_limites.md) |

Decisões de implementação: [decision-register.md](../decision-register.md).

## Como citar no relatório

1. Ler a [nota](notas/) antes de citar.
2. Indicar **o que a fonte diz**, **o que o código faz** e **o gap** (ver [mapa_literatura_codigo.md](mapa_literatura_codigo.md)).
3. Usar chaves de [bibliografia.bib](bibliografia.bib) no LaTeX/Overleaf.
