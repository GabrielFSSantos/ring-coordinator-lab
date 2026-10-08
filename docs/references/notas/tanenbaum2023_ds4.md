# Tanenbaum & van Steen — Distributed Systems

**Citação:** van Steen, M.; Tanenbaum, A. S. *Distributed Systems*, 4th ed., distributed-systems.net, 2023. BibTeX: `tanenbaum2023ds`.

**PDF local:** [../pdfs/van_steen_tanenbaum_distributed_systems_4ed.pdf](../pdfs/van_steen_tanenbaum_distributed_systems_4ed.pdf)

**Edição online:** [distributed-systems.net/ds4](https://www.distributed-systems.net/index.php/books/ds4/)

## Tese central (para este lab)

Livro-texto: arquiteturas, processos, comunicação, **coordenação** (sincronização, eleição, exclusão mútua), tolerância a falhas e replicação — enquadramento didático do TP.

## O que tomamos no lab

- Separação **cliente / servidor** (nós regulares vs coordenador).
- **Recurso compartilhado** externo ao processo (PostgreSQL).
- Comunicação por **mensagens** (Socket.IO).

## Diferença no nosso caso

- Não cobrimos replicação, consenso nem segurança do livro.
- Coordenação é **ad hoc** em um único módulo Node, não camada de middleware.

## Documentação

- [01_visao_e_conceitos_sd.md](../../documentation/01_visao_e_conceitos_sd.md)
- [16_fundamentacao_bibliografica.md](../../documentation/16_fundamentacao_bibliografica.md)
