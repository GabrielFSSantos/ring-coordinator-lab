# Ongaro & Ousterhout (2014) — Raft

**Citação:** Ongaro, D.; Ousterhout, J. In Search of an Understandable Consensus Algorithm. USENIX ATC, 2014. BibTeX: `ongaro2014raft`.

**PDF local:** [../pdfs/ongaro_ousterhout_2014_raft_understandable_consensus.pdf](../pdfs/ongaro_ousterhout_2014_raft_understandable_consensus.pdf)

## Tese central

**Consenso** replicado com líder eleito por **maioria**, termos monotônicos e log replicado — alternativa moderna a Paxos.

## O que tomamos no lab

- Apenas **contraste**: nosso lab **não** implementa Raft.
- Útil para explicar por que **anel + max(porta)** não tolera partição como Raft.

## Documentação

- [12_invariantes_e_limites.md](../../documentation/12_invariantes_e_limites.md)
- [mapa_literatura_codigo.md](../mapa_literatura_codigo.md)

## Próximo passo

- Roadmap longo prazo: substituir eleição em anel por Raft só se o escopo do TP mudar para consenso.
