# Chang & Roberts (1979) — eleição em anel

**Citação (IEEE):** Chang, E.; Roberts, R. An Improved Algorithm for Decentralized Extrema-Finding in Circular Configurations of Processes. *Communications of the ACM*, 22(5), 281–283, 1979. DOI: [10.1145/359104.359108](https://doi.org/10.1145/359104.359108). BibTeX: `chang1979extrema`.

**PDF local:** [../pdfs/chang_roberts_1979_extrema_finding_ring_election.pdf](../pdfs/chang_roberts_1979_extrema_finding_ring_election.pdf)

## Tese central

Processos em anel unidirecional elegem o extremo (maior ou menor ID) sem controlador central. Cada processo envia seu identificador ao sucessor; mensagens com ID menor são descartadas; quando o próprio ID retorna, o processo declara-se líder. Complexidade média de mensagens O(n log n), melhor que O(n²) de Le Lann.

## O que tomamos no lab

- **Anel lógico** com sucessor fixo (`electSuccessor`).
- **Critério de maior ID** entre participantes (`Math.max(...electionList)`).
- **Circulação de mensagens** de eleição (`ELEICAO`).

## Diferença no nosso caso

- Mensagem carrega **lista de portas**, não só o maior ID visto (variante próxima a Le Lann O(n²)).
- Ramo que **reinicia** a lista quando `electionList[0] < this.port` (influência de bully, não está no artigo).
- Transporte **Socket.IO** assíncrono; artigo assume canal FIFO confiável entre vizinhos.
- Propagação do líder via `COORDENADOR` com atraso fixo de 15s.

## Código e documentação

- [`src/server/DistribuitedNode.js`](../../../src/server/DistribuitedNode.js) — `startElection`, `electSuccessor`
- [05_eleicao_em_anel.md](../../documentation/05_eleicao_em_anel.md)

## Próximo passo de engenharia

- **B-CR1:** implementar Chang–Roberts literal (mensagem com `maxUid` apenas, descarte se `uid < self`) — ver [engineering_backlog.md](../../documentation/engineering_backlog.md).
