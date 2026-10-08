# Glossário — sistemas distribuídos

Termos usados na documentação e na defesa do TP.

| Termo | Definição curta | No Ring Coordinator Lab |
| --- | --- | --- |
| **Processo** | Programa com estado próprio executando em um nó | Container `ubuntu-node-x` |
| **Mensagem** | Comunicação assíncrona entre processos | Eventos Socket.IO |
| **Líder / coordenador** | Processo com papel especial acordado | `isCoordinator`, grava no DB |
| **Eleição de líder** | Protocolo para escolher o coordenador | `ELEICAO` / `COORDENADOR` |
| **Anel lógico** | Topologia em que cada processo tem um sucessor | `electSuccessor` |
| **Exclusão mútua** | Apenas um processo na seção crítica | Fila no coordenador |
| **Mutex centralizado** | Árbitro único concede acesso | `log_request` → fila → `INSERT` |
| **Safety (segurança)** | Nada de “ruim” acontece | Serialização no coordenador (escopo limitado) |
| **Liveness (vivacidade)** | Algo de “bom” eventualmente acontece | Eleição e retries com delays — não provado formalmente |
| **Fail-stop** | Processo falha parando de responder | Aproximado por timeout 10s |
| **SPOF** | Single point of failure | PostgreSQL, possivelmente coordenador |
| **Partição** | Rede divide o sistema | Não tratada; risco de múltiplos líderes |

Ver também [comparacao_algoritmos.md](comparacao_algoritmos.md).
