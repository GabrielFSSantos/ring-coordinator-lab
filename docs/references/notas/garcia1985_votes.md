# Garcia-Molina & Barbara (1985) — atribuição de votos

**Citação:** Garcia-Molina, H.; Barbara, D. How to Assign Votes in a Distributed System. *Journal of the ACM*, 32(4), 841–860, 1985. DOI: [10.1145/4221.4223](https://doi.org/10.1145/4221.4223). BibTeX: `garcia1985votes`.

**PDF local:** [../pdfs/garcia_molina_barbara_1985_how_to_assign_votes.pdf](../pdfs/garcia_molina_barbara_1985_how_to_assign_votes.pdf)

## Tese central

**Mutex** e operações restritas em sistemas particionados podem usar **votos** ou **coteries** para garantir que grupos concorrentes não executem seções críticas incompatíveis.

## O que tomamos no lab

- Ideia de que **apenas um grupo** deve gravar no recurso compartilhado (um coordenador ativo).

## Diferença no nosso caso

- **Sem votos nem quorum**; um único coordenador sem prova em partição.
- Postgres é **SPOF**; não há replicação de estado.

## Documentação

- [12_invariantes_e_limites.md](../../documentation/12_invariantes_e_limites.md)
- [mapa_literatura_codigo.md](../mapa_literatura_codigo.md) — linha consenso/partição

## Próximo passo de engenharia

- Para TP avançado: discutir partição na banca usando este artigo; implementação futura opcional (Raft).
