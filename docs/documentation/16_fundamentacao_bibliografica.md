# 16 Fundamentação bibliográfica

Como ler este repositório como **misto código + teoria** (sem monografia): cada tópico tem implementação em [`DistribuitedNode.js`](../../src/server/DistribuitedNode.js), explicação em `documentation/`, e fontes em [`references/`](../references/README.md).

## Três camadas

| Camada | Onde |
| --- | --- |
| **Fonte** | PDF em `references/pdfs/`, nota em `references/notas/`, chave BibTeX em `bibliografia.bib` |
| **Conceito** | Capítulos `01`, `05`, `06`, `10`, `12`, [comparacao_algoritmos.md](../references/comparacao_algoritmos.md) |
| **Código** | [14_arquitetura_e_manutencao.md](14_arquitetura_e_manutencao.md), [mapa_literatura_codigo.md](../references/mapa_literatura_codigo.md) |

## Roteiro de leitura (desenvolvedor)

1. [references/README.md](../references/README.md) — âncoras e status PDF
2. [mapa_literatura_codigo.md](../references/mapa_literatura_codigo.md)
3. [05_eleicao_em_anel.md](05_eleicao_em_anel.md) + [nota Chang–Roberts](../references/notas/chang1979_ring_election.md)
4. [06_exclusao_mutua_centralizada.md](06_exclusao_mutua_centralizada.md) + [nota Velazquez](../references/notas/velazquez1993_mutex_survey.md)
5. [12_invariantes_e_limites.md](12_invariantes_e_limites.md)

## Roteiro “banca em 20 minutos”

1. **Problema:** líder + recurso compartilhado com mutex centralizado — [01_visao_e_conceitos_sd.md](01_visao_e_conceitos_sd.md).
2. **Teoria:** Chang–Roberts (anel) + Velazquez (mutex permission-based) — slides ou PDF local.
3. **Demo:** [00_quickstart.md](00_quickstart.md) — `docker compose up`, `log_entries`, logs de eleição.
4. **Honestidade:** [12_invariantes_e_limites.md](12_invariantes_e_limites.md) — o que não é Raft nem Chang–Roberts literal.
5. **Evolução:** [mapa_literatura_codigo.md](../references/mapa_literatura_codigo.md) — roadmap B-CR1, B-ELEC1.

## Formato de parágrafo no relatório (modelo)

> Segundo Chang e Roberts (`chang1979extrema`), em anel unidirecional o maior identificador é eleito com extinção seletiva de mensagens. Neste lab, `startElection` circula uma lista de portas e escolhe `Math.max(...electionList)` (**gap B-CR1**), mantendo anel lógico via `electSuccessor`.

Repita o padrão para mutex (Velazquez / fila no coordenador) e falhas (Garcia 1982 / timeout).

## Índice

Série completa: [documentation/README.md](README.md).
