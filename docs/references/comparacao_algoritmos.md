# Comparação com algoritmos clássicos

Posicionamento do **Ring Coordinator Lab** com **citações BibTeX**. Notas: [README.md](README.md). Mapa código: [mapa_literatura_codigo.md](mapa_literatura_codigo.md).

## Eleição em anel (`chang1979extrema`, `utexas_lcr_notes`)

| Aspecto | Chang–Roberts (anel) | Este lab |
| --- | --- | --- |
| Mensagem | Carrega maior ID visto | Carrega **lista** de portas (`ELEICAO`) |
| Participação | Extinção seletiva de IDs menores | Vários ramos em `startElection`; reinício se `electionList[0] < this.port` |
| Líder | Maior ID na mensagem final | `Math.max(...electionList)` quando volta ao iniciador |
| Complexidade | O(n log n) médio (artigo) | Não otimizado; cluster n=4 |
| Prova | Textbook / UT notes | Variante ad hoc — **B-CR1** |

Nota: [notas/chang1979_ring_election.md](notas/chang1979_ring_election.md).

## Bully (`garcia1982elections`)

| Aspecto | Bully | Este lab |
| --- | --- | --- |
| Ideia | Maior ID força menores a aceitar coordenador | Influência no reinício de lista; não é bully completo |
| Mensagens | Broadcast a IDs maiores | Anel via `electSuccessor` |

Nota: [notas/garcia1982_bully.md](notas/garcia1982_bully.md).

## Token ring (mutex distribuído)

| Aspecto | Token ring | Este lab |
| --- | --- | --- |
| Mutex | Token circula na SC | **Não** — fila no coordenador (`velazquez1993survey`) |
| Anel | Token | Anel para **eleição** |

## Exclusão mútua centralizada (`velazquez1993survey`, `tanenbaum2023ds`)

| Aspecto | Modelo de curso | Este lab |
| --- | --- | --- |
| Clientes pedem permissão | Sim | `log_request` |
| Servidor serializa | Sim | `requestQueue` + `isProcessing` |
| Falha do servidor | Reeleição | Timeout 10s → `Disconnect` (`garcia1982elections`) |

Nota: [notas/mutex_centralizado.md](notas/mutex_centralizado.md).

## Consenso (`ongaro2014raft`)

Não implementado. Eleição em anel **≠** Raft; sem log replicado nem quorum. Contraste: [notas/ongaro2014_raft.md](notas/ongaro2014_raft.md), [12_invariantes_e_limites.md](../documentation/12_invariantes_e_limites.md).

## Leitura cruzada

- Implementação: [05_eleicao_em_anel.md](../documentation/05_eleicao_em_anel.md), [06_exclusao_mutua_centralizada.md](../documentation/06_exclusao_mutua_centralizada.md)
- Fundamentação: [16_fundamentacao_bibliografica.md](../documentation/16_fundamentacao_bibliografica.md)
