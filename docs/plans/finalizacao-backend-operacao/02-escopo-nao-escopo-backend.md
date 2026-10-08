# 02 Escopo e não escopo (backend)

## Resumo

Define o que a finalização do backend **deve** entregar para operação local, demo automática e teste LAN com 2 PCs, preparando o console web sem implementar UI neste repo na mesma fase.

## Pré-requisitos

- [01-estado-atual-e-gaps.md](01-estado-atual-e-gaps.md)

## Dentro do escopo

1. **Um** `docker-compose.yml` + `lab.env` / `lab.env.example` para todos os perfis (Docker local 4 nós, LAN com/sem storage no host).
2. Simulação demo **fixa por env** (até API/UI): 2 transações / 5 s **por follower**, modo `auto`, queda lógica do líder / 25 s.
3. Trilha de logs estruturada e desligável por flags (incl. `LOG_SIM`).
4. **Descoberta LAN automática** (mDNS serviço lab) com fallback `DISCOVERY_MODE=manual` e `CLUSTER_PEERS`.
5. API HTTP **controle v1** nos nós (simulação, pause, kill manual, transação única) + leitura storage inalterada.
6. Testes unitários adicionais (burst, kill guard, discovery mock) e checklist manual 2 PCs.
7. Atualização documental canônica, gate, harness (descrito em cap. 11).
8. **Playbook LAN multi-host** — storage host + N participants Docker ([14-cenario-lan-multi-host.md](14-cenario-lan-multi-host.md)).

## Fora do escopo

- Raft, quorum, eleição de storage sob partição forte.
- Autenticação de produção, TLS obrigatório, rate limit global em gateway.
- Frontend (pacote separado [console-frontend-lab](../console-frontend-lab/README.md)).
- `docker stop` remoto de containers como mecanismo de kill (kill permanece lógico in-band).
- Bugbot / revisão automatizada de PR como entrega.
- Zeroconf fora da rede local do lab (internet).
- **Replicar** transações descartadas durante `storage_down` (política de aula).
- HA com múltiplos storages primários ativos.

## Decisões e invariantes

- **Um primário de ledger** por rede lab; segundo host com intenção de storage vira standby (comportamento já existente, revalidar em LAN).
- Controles dinâmicos de taxa/kill **devem** convergir para os mesmos campos expostos em `PATCH /v1/simulation` (cap. 09).

## Critérios de aceite

- [ ] Implementação futura cobre todos os itens “dentro do escopo” sem expandir para itens “fora”.
- [ ] [13-checklist-aceite-backend.md](13-checklist-aceite-backend.md) verificável após deploy.

## Riscos

| Risco | Mitigação |
| --- | --- |
| Escopo mDNS grande | Fase dedicada P5; fallback manual sempre disponível |
| API controle aberta na LAN | Documentar token opcional `NODE_CONTROL_TOKEN` no cap. 09 |
