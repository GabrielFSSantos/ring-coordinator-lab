# DTU (2017) — Distributed Elections

**Citação:** Distributed Elections, course 02220, Technical University of Denmark, 2017. BibTeX: `dtu2017elections`.

**PDF local:** [../pdfs/dtu_2017_distributed_elections_slides.pdf](../pdfs/dtu_2017_distributed_elections_slides.pdf)

## Tese central

Descreve eleição em anel (Chang–Roberts): participação, comparação de IDs, mensagem **elected** que circula anunciando o coordenador e propriedade de **safety** E1.

## O que tomamos no lab

- Propagação de identidade do líder após eleição (`coordinator_announce` com IP).
- Critério “maior identificador” entre processos vivos na rodada.

## Diferença no nosso caso

- Evento `coordinator_announce` com espera de 15s; não há estado `non-participant` explícito como nos slides.
- Múltiplas eleições concorrentes no boot.

## Código

- `startElection` ramo `electionList[0] == this.port` — emissão `coordinator_announce`

## Próximo passo

- **B-ELEC1:** alinhar notificação ao padrão `elected` (uma rodada, sem delay arbitrário).
