# 12 Invariantes e limites

Separação útil para **relatório**, **banca** e **edição de código**: o que você pode **afirmar com honestidade** vs. o que é **limitação conhecida**.

## O que o TP pode afirmar (escopo didático)

| Afirmação | Base |
| --- | --- |
| Processos comunicam por mensagens (Socket.IO), sem memória compartilhada entre nós | Arquitetura |
| Existe no máximo um coordenador **por rodada de eleição concluída** em cluster estável | `coordinator_announce` + critério `max(porta)` |
| Acesso ao log compartilhado passa pelo coordenador | `log_request` / fila |
| Gravações no coordenador são serializadas pela fila JS | `isProcessing` + um `processRequest` ativo |
| Falha de resposta do coordenador dispara tentativa de nova eleição | Timeout 10s + `Disconnect` |

## O que o TP não deve afirmar

| Não afirmar | Motivo |
| --- | --- |
| Algoritmo Chang–Roberts ou bully “de livro” | Protocolo próprio; ver [comparacao_algoritmos.md](../references/comparacao_algoritmos.md) |
| Tolerância a partição (CP/AP) | Sem consenso; possível split-brain |
| Prova formal de safety/liveness | Não há modelo formal nem demonstração |
| Detecção de falha completa | Timeouts ad hoc; conexão fraca em `connecToNode` |
| Alta disponibilidade do recurso | Postgres único (SPOF) |
| Mutex distribuído no anel | Mutex é **centralizado** no coordenador |

## Storage na LAN

| Afirmação | Comportamento |
| --- | --- |
| Um primário writable por LAN (mDNS) | Segundo `STORAGE_MODE=primary` vira **standby** e aponta para o remoto |
| Nós e tail adotam URL canônica | mDNS + estado do cluster (debounce) |
| Primário cai | TX rejeitadas; **sem** failover automático para outro SQLite |

## Limitações de implementação (engenharia)

Documentadas também em [engineering_backlog.md](engineering_backlog.md):

- Variante de eleição não é Chang–Roberts (**B-CR1**).
- Partição de rede não tratada; possível split-brain.
- SQLite único (SPOF) — adequado ao escopo didático.

## Para defesa oral

Use [references/glossario_sd.md](../references/glossario_sd.md) para vocabulário e [comparacao_algoritmos.md](../references/comparacao_algoritmos.md) para posicionar o desenho frente aos algoritmos clássicos, enfatizando **trade-offs conscientes** de um TP.

## Fundamentação bibliográfica — tabela para a banca

| Afirmativa do TP | Exigência típica na literatura | Situação no lab |
| --- | --- | --- |
| Um coordenador serializa gravações | Permission-based (`velazquez1993survey`) | Sim, via fila |
| Eleição em anel | Chang–Roberts (`chang1979extrema`) | Variante (lista + max) — **B-CR1** |
| Eleição segura sob partição | Quorum / Raft (`ongaro2014raft`) | Não |
| Mutex sob partição | Votos (`garcia1985votes`) | Não |
| Prova safety/liveness | Lynch (`lynch1996distributed`) | Não formalizada |

Mapa completo: [mapa_literatura_codigo.md](../references/mapa_literatura_codigo.md).
