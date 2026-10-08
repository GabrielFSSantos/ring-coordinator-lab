# MIT 6.824 — notas de aula Raft

**Citação:** MIT 6.824 lecture notes (Raft). BibTeX: `mit6824raftnotes`.

**Arquivo local:** [../pdfs/mit_6824_raft_lecture_notes.txt](../pdfs/mit_6824_raft_lecture_notes.txt)

## Tese central

Eleição de líder por **timeout** e **votos de maioria**; no máximo um líder por termo; heartbeats para estabilidade.

## O que tomamos no lab

- Analogia superficial: **timeout** de 10s no cliente lembra “suspeita de líder morto”, mas sem votos nem termos.

## Diferença

- Lab usa anel e `Disconnect` de aplicação, não RequestVote/AppendEntries.

## Documentação

- [10_falhas_e_recuperacao.md](../../documentation/10_falhas_e_recuperacao.md)
