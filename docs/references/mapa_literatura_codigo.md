# Mapa literatura ↔ código

Tabela central: **fonte**, **documentação**, **código** e **gap**.

| Tópico | Fonte primária (BibTeX) | Doc técnica | Código | Gap / backlog |
| --- | --- | --- | --- | --- |
| Eleição em anel | `chang1979extrema`, `utexas_lcr_notes` | [05](../documentation/05_eleicao_em_anel.md), [07](../documentation/07_contrato_socket_io.md) | `NodeApplication.startElection`, `RingTopology`, `ElectionService` | **B-CR1** — lista de portas vs ID máximo na mensagem |
| Notificação do líder | `dtu2017elections` | [05](../documentation/05_eleicao_em_anel.md) | `coordinator_announce` + `epoch` | Aplicado sem delay artificial (**B-ELEC1** resolvido) |
| Sucessor no anel | `chang1979extrema` | [05](../documentation/05_eleicao_em_anel.md) | `RingTopology.successorPort`, `connectPeer` | Retry limitado (**B6/B7** resolvidos) |
| Mutex centralizado | `velazquez1993survey`, `tanenbaum2023ds` | [06](../documentation/06_exclusao_mutua_centralizada.md) | `RequestQueue`, `addToQueue` | Permission-based simplificado; fila com `queue_full` explícito |
| Recurso compartilhado | `tanenbaum2023ds` | [09](../documentation/09_persistencia_sqlite.md) | `SqliteLogRepository` | SPOF do arquivo SQLite (didático) |
| Falha + reeleição | `garcia1982elections` | [10](../documentation/10_falhas_e_recuperacao.md) | `coordinator_suspect`, debounce eleição | Sem asserções formais Garcia |
| Partição / quorum | `garcia1985votes`, `ongaro2014raft` | [12](../documentation/12_invariantes_e_limites.md) | — | Sem consenso; split-brain possível |

## Roadmap opcional

1. **B-CR1** — Chang–Roberts (mensagem com maior UID).

## Manutenção

Nova referência: entrada em `bibliografia.bib` + `notas/` + linha nesta tabela + matriz em [docs/README.md](../README.md).
