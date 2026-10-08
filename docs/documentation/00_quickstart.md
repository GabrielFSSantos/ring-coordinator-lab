# 00 Quickstart

## Pré-requisitos

- Docker e Docker Compose
- Node.js 20+ (opcional, só para `npm test` em `src/`)

## Subir o ambiente

```bash
cd ~/GitHub/ring-coordinator-lab
docker compose up --build
```

Aguarde os quatro nós (`ubuntu-node-2` … `ubuntu-node-5`) e o Postgres saudável. Cada nó imprime `Node server running on port 300x` e, após ~5s, mensagens de eleição.

## Serviços e portas no host

| Serviço | Porta host | Função |
| --- | --- | --- |
| `ubuntu-node-2` | 3002 | Nó distribuído |
| `ubuntu-node-3` | 3003 | Nó distribuído |
| `ubuntu-node-4` | 3004 | Nó distribuído |
| `ubuntu-node-5` | 3005 | Nó distribuído |
| `postgres` | 5432 | Banco `distributed_systems_db` |
| `dbadmin` (pgAdmin) | 5050 | UI web |

Credenciais pgAdmin (compose): e-mail `admin@admin.com`, senha `pgadmin4`.

## Verificar que está funcionando

### Logs dos nós

```bash
docker compose logs -f ubuntu-node-5
```

Procure:

- `Lista de Processos da Eleição: [...]`
- `Conectado ao coordenador` (nós regulares)
- `Conectado ao banco de dados PostgreSQL` (coordenador)
- `Gravação no banco de dados bem-sucedida` (coordenador processando fila)

### Dados no PostgreSQL

Via cliente SQL ou pgAdmin (servidor `172.25.0.6`, usuário `user`, senha `password`, banco `distributed_systems_db`):

```sql
SELECT * FROM log_entries ORDER BY timestamp DESC LIMIT 20;
```

Novas linhas devem aparecer ao longo do tempo (intervalo aleatório entre requisições dos nós regulares).

## Parar

```bash
docker compose down
```

Volume `db_data` persiste dados entre subidas. Para resetar o banco: `docker compose down -v` (apaga volume).

## Troubleshooting rápido

| Sintoma | Verificar |
| --- | --- |
| Nós não conectam | Rede `172.25.0.0/16`; `IP_LIST` e `IP_LOCAL` em [02_infra_docker_compose.md](02_infra_docker_compose.md) |
| Sem INSERT | Qual nó é coordenador nos logs; Postgres em `172.25.0.6` |
| Porta em uso no host | Outro processo em 3002–3005 ou 5432 |
| `npm test` falha | Suite legada — ver [15_testes_e_gate.md](15_testes_e_gate.md) |

Próximo passo conceitual: [01_visao_e_conceitos_sd.md](01_visao_e_conceitos_sd.md). Fluxo completo: [11_fluxo_ponta_a_ponta.md](11_fluxo_ponta_a_ponta.md).
