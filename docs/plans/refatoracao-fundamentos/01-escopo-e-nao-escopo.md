# 01 Escopo e não escopo

## Dentro do escopo

- Eleição em anel (variante lista + `max(NODE_PORT)`).
- Mutex centralizado no coordenador.
- Persistência em SQLite (único escritor).
- Recuperação por timeout de aplicação e nova eleição.
- Código organizado em domínio / aplicação / infraestrutura.

## Fora do escopo

- Raft, quorum, consenso sob partição.
- Chang–Roberts literal (gap documentado em B-CR1).
- Alta disponibilidade do banco.
- UI além de inspecionar `data/log.db`.

Ver também [12_invariantes_e_limites.md](../../documentation/12_invariantes_e_limites.md).
