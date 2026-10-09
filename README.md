# Ring Coordinator Lab

Eleição em anel, mutex centralizado e ledger compartilhado (storage HTTP).

## Requisitos

| Runtime | O que precisa |
| --- | --- |
| **Docker** | Docker Desktop com integração WSL (Ubuntu) — `./lab storage` e `./lab start` |
| **Nativo** | Node.js **20+** — `./lab node`, `./lab logs`; `./lab start --native` (4 processos) |

Na mesma rede: mDNS (UDP **5353**), TCP **4000** e portas do anel (**3002+**). **Um** banco primário por LAN.

```bash
git clone git@github.com:GabrielFSSantos/ring-coordinator-lab.git
cd ring-coordinator-lab
chmod +x lab
```

## Quatro comandos principais

| Comando | O que faz |
| --- | --- |
| `./lab storage` | Só o banco (`ring-storage` ou processo nativo com `--native`) |
| `./lab start` | Quatro nós Docker em primeiro plano (Ctrl+C para); `--native` = 4 processos no host |
| `./lab node` | Um nó no PC (nativo); `--docker` = container `ring-node-join` |
| `./lab logs` | Visualizador de narrativa no host (poll na timeline do storage) |

Auxiliares: `./lab health`, `./lab down`.

**Ordem livre:** pode subir `./lab start` ou `./lab node` antes do banco; o líder **rejeita** transações até o storage responder. `./lab storage` depois dos nós e o cluster volta a gravar.

**Exemplo sala (um PC demo):**

```bash
./lab storage          # terminal 1 (ou antes/depois dos nós)
./lab start            # terminal 2 — ou LAB_START_DETACHED=1 ./lab start
./lab logs             # terminal 3
```

Se mDNS falhar: `LAB_STORAGE_HOST=<IP-do-banco>` no `lab.env` e suba de novo.

Banco nativo + nós Docker: após `./lab storage --native`, o `lab.env` define `LAB_DOCKER_STORAGE_URL=http://host.docker.internal:4000` para os containers.

## Testes

```bash
cd src && npm ci && npm test
```

Gate: `Workspaces/ring-coordinator-lab/harness/checks/run-gate.sh`

Aceite E2E:

```bash
LAB_ACCEPTANCE_START=1 harness/checks/run-acceptance.sh
```
