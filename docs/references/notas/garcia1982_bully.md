# Garcia-Molina (1982) — eleições em sistemas distribuídos

**Citação:** Garcia-Molina, H. Elections in a Distributed Computing System. *IEEE Transactions on Computers*, 31(1), 48–59, 1982. DOI: [10.1109/TC.1982.1675885](https://doi.org/10.1109/TC.1982.1675885). BibTeX: `garcia1982elections`.

**PDF local:** [../pdfs/garcia_molina_1982_elections_in_distributed_system.pdf](../pdfs/garcia_molina_1982_elections_in_distributed_system.pdf)

## Tese central

Após falha, o sistema deve **reorganizar** e **eleger um coordenador**. O artigo define **asserções** de correção de eleição em ambientes de falha “razoáveis” e apresenta algoritmos, incluindo o **Bully** (maior ID vence).

## O que tomamos no lab

- Papel de **coordenador** que gerencia operação compartilhada (gravação no log).
- **Reeleição** após percepção de falha (timeout → `Disconnect` → nova `startElection`).
- Prioridade por **identificador numérico** (`NODE_PORT`).

## Diferença no nosso caso

- Não implementamos o Bully completo (mensagens a todos os IDs maiores).
- **Asserções formais** do artigo não são verificadas no código.
- Ambiente com falhas de comunicação parciais (`connecToNode` fraco) viola suposições do Bully clássico.

## Código e documentação

- `initiateRandomRequests`, handler `Disconnect` — [`DistribuitedNode.js`](../../../src/server/DistribuitedNode.js)
- [10_falhas_e_recuperacao.md](../../documentation/10_falhas_e_recuperacao.md)

## Próximo passo de engenharia

- Documentar modelo de falha alvo (fail-stop simplificado) e reduzir sleeps **B5** com base em timeouts derivados de Garcia 1982.
