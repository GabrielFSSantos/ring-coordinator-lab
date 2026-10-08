# Velazquez (1993) — survey de mutex distribuído

**Citação:** Velazquez, M. G. A Survey of Distributed Mutual Exclusion Algorithms. Technical Report CS-93-116, Colorado State University, 1993. BibTeX: `velazquez1993survey`.

**PDF local:** [../pdfs/velazquez_1993_survey_distributed_mutual_exclusion.pdf](../pdfs/velazquez_1993_survey_distributed_mutual_exclusion.pdf)

## Tese central

Classifica algoritmos de exclusão mútua em **token-based** e **permission-based** (pedido de permissão a conjuntos ou coordenador). Compara desempenho e estruturas (majority, grid, árvore).

## O que tomamos no lab

- **Permission-based simplificado:** clientes pedem; **um servidor** (coordenador) serializa.
- Fila FIFO no coordenador ≈ fila de pedidos ao árbitro.

## Diferença no nosso caso

- Não é Ricart–Agrawala, Maekawa, nem token ring.
- Fila cheia **descarta** pedidos; survey assume protocolos sem perda silenciosa.
- Mutex só no processo coordenador; não há prova distribuída de entrada na SC.

## Código e documentação

- `addToQueue`, `processRequest` — [`DistribuitedNode.js`](../../../src/server/DistribuitedNode.js)
- [06_exclusao_mutua_centralizada.md](../../documentation/06_exclusao_mutua_centralizada.md)

## Próximo passo de engenharia

- **B-MUTEX1:** manter centralizado mas documentar invariantes de fila; opcional token ring como trabalho futuro.
