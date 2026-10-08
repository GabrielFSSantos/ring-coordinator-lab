# 10 Falhas e recuperação

O lab modela falhas de forma **simplificada**, baseada em timeouts de aplicação e eventos explícitos — não há detector de falha distribuído clássico (heartbeats entre todos os pares).

## Timeout de resposta ao coordenador (10s)

Em `initiateRandomRequests`:

1. Nó regular emite `log_request` com `requestId` único.
2. Registra `once` em `log_response-{requestId}`.
3. Se **10s** sem resposta: marca `tookTimeout = true`, remove listener.

No próximo tick do `setInterval` (base **15s**):

- Emite `Disconnect` no socket do coordenador.
- Define `inElection = true` e chama `startElection([])`.

**Efeito esperado:** coordenador (e outros que ouvem `Disconnect`) executam `removeCoordinator`, pausam longamente e tentam `connectToRing`.

## Handler Disconnect no servidor

Qualquer conexão que envia `Disconnect`:

1. Tenta `socket.off("log_request", ...)` (referência de função não coincide com o handler registrado — remoção ineficaz).
2. `removeCoordinator()` — limpa papel de líder, fila se coordenador.
3. Espera **80 segundos**.
4. `connectToRing()` — visita outros nós e emite `reconnect`.

## Reconexão de nó ausente

`reconnect({ port })`:

- Reconstrói IP `172.25.0.{port % 3000}` e reinsere na `ipList`.
- Se `this.port + 1 == portSee`, sucessor pode reemitir `COORDENADOR`.

## Falha de conexão entre nós

`electSuccessor` pode entrar em **recursão infinita** se nenhum peer aceitar conexão — cenário de cluster totalmente isolado.

`connecToNode` não valida `connected` após 3s — falso positivo de “socket pronto”.

## Cenários didáticos

| Ação | Comando / método | Resultado esperado (happy path) |
| --- | --- | --- |
| Parar coordenador | `docker stop ubuntu-node-5` | Timeouts nos clientes, nova eleição; novo líder provável 3004 |
| Parar Postgres | `docker stop postgres` | INSERT falha; respostas `Failure`; sistema não recupera DB sozinho |
| Reiniciar nó | `docker start ubuntu-node-3` | `reconnect` pode repopular `ipList` |

## Cenários frágeis

- Partição de rede: dois grupos podem eleger líderes diferentes (sem consenso).
- Múltiplas eleições simultâneas no boot.
- Delays 15s / 80s atrasam recuperação visível.

Invariantes: [12_invariantes_e_limites.md](12_invariantes_e_limites.md). Teoria: [references/notas/detecao_de_falhas.md](../references/notas/detecao_de_falhas.md).

## Fundamentação bibliográfica

Garcia-Molina (`garcia1982elections`) define **eleição após falha** com asserções de correção em ambientes restritos. O lab aproxima isso com **timeout de aplicação** (10s) e evento `Disconnect`, sem prova formal.

| Garcia 1982 (ideia) | Lab | Gap |
| --- | --- | --- |
| Reconfigurar após falha | Nova `startElection` | Sleeps 80s/15s (**B5**) |
| Coordenador único acordado | `COORDENADOR` | Partição não tratada |
| Bully / asserções | Timeout cliente | Não é bully completo |

Raft (`ongaro2014raft`, `mit6824raftnotes`) é **contraste**: eleição por maioria e termos — não implementado.

Nota: [garcia1982_bully.md](../references/notas/garcia1982_bully.md).
