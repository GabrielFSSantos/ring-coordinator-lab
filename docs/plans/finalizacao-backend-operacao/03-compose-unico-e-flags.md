# 03 Compose único e flags

## Resumo

Substituir a duplicidade `docker-compose.yml` + `docker-compose.lan.yml` por **um** arquivo na raiz do repo, cujo comportamento é selecionado por variáveis em `lab.env` (e interpolação `docker compose --env-file lab.env`).

## Pré-requisitos

- [04-lab-env-perfis.md](04-lab-env-perfis.md)
- [02-escopo-nao-escopo-backend.md](02-escopo-nao-escopo-backend.md)

## Decisões e invariantes

- **DEVE** existir apenas `docker-compose.yml` após a fase de implementação; `docker-compose.lan.yml` **DEVE** ser removido.
- Serviço `storage` **DEVE** subir somente quando `STORAGE_MODE=primary` ou `standby` no host que executa compose com perfil storage (ver tabela abaixo).
- Nós **DEVEM** usar `env_file: lab.env` e overrides mínimos por instância (`NODE_PORT`, `ADVERTISE_HOST`, `IP_LOCAL`).
- Gate **DEVE** validar: `docker compose --profile local --env-file lab.env config` e profiles LAN.

## Modelo proposto

### Perfis Compose (profiles)

| Profile | Serviços |
| --- | --- |
| `local` | `storage` + `ubuntu-node-2..5` (bridge 172.25.0.x) |
| `storage` | `lan-storage` (ledger, `network_mode: host`) |
| `nodes` | `lan-node` (supervisor `NODE_COUNT`, host network) |

Comandos: ver [lab.env.example](../../../lab.env.example) e [scripts/lan-up.sh](../../../scripts/lan-up.sh).

### Docker na LAN (Wi‑Fi / Ethernet)

- Um único [lab.env.example](../../../lab.env.example); `STORAGE_URL` igual em todos os PCs.
- Publicar portas via host network (`lan-node` / `lan-storage`).
- **WSL2:** `ADVERTISE_HOST` = IP Wi‑Fi do Windows (não só `172.x` do WSL) se peers estão em outros notebooks.

### Contagem de nós

| Variável | Função |
| --- | --- |
| `RING_NODE_COUNT` | Número de containers nó no perfil docker-4nodes (default 4; lab local) |
| `NODE_COUNT` | Processos por container (supervisor `main.js`; 1–4) — já existente |

Geração de serviços: **opção A (recomendada v1 execução):** manter 4 serviços explícitos no YAML com anchor `x-node-common` até script `scripts/render-compose-nodes.sh` (opção B) gerar fragmento — documentar em fase P2 se 8 nós forem necessários.

### Storage condicional

```yaml
# Comportamento normativo (pseudo)
# Se STORAGE_MODE=none no lab.env do host → não incluir serviço storage neste host
# Se primary → storage + volume ./data:/data
```

Hosts LAN sem banco: `STORAGE_MODE=none`, `STORAGE_URL=http://<IP-PC-A>:4000`.

## Comportamento esperado

### Docker local (sua máquina)

```bash
docker compose --env-file lab.env up --build --remove-orphans
```

`lab.env` com rede `172.25.0.x`, 4 nós, storage em `.10`.

### PC na Wi‑Fi (sem compose de segundo arquivo)

Mesmo comando, `lab.env` com `ADVERTISE_HOST=<IP-WiFi>`, `DISCOVERY_MODE=mdns`, `STORAGE_MODE=none` ou `primary`.

## Arquivos alvo

| Path | Ação |
| --- | --- |
| `docker-compose.yml` | Unificar perfis |
| `docker-compose.lan.yml` | Remover |
| `lab.env`, `lab.env.example` | Perfis documentados |
| `harness/checks/run-gate.sh` | `docker compose --env-file lab.env config` |
| `README.md` (raiz) | Um único comando |

## Critérios de aceite

- [ ] `docker compose --env-file lab.env config` sem erro para perfis `docker-4nodes` e `lan-node`.
- [ ] Documentação não referencia `docker-compose.lan.yml`.
- [ ] Gate atualizado no harness.

## Riscos

| Risco | Mitigação |
| --- | --- |
| YAML dinâmico para N nós | Começar com 4 fixos + `RING_NODE_COUNT` só documentado para script fase 2 |
| WSL2 IP vs Wi‑Fi | `ADVERTISE_HOST` explícito no perfil LAN |

## Fora de escopo

- Orquestração Kubernetes.
