# 17 Simulação LAN e ledger

## Modos

| Flag | Efeito |
| --- | --- |
| `SIM_TX_ENABLED=true` | Followers enviam transações simuladas periódicas |
| `SIM_LEADER_SELF_TERM=true` | O **coordenador atual** renuncia após `SIM_LEADER_TENURE_MS` |
| `SIM_MODE=auto` (legado) | Equivale a TX + self-term se tenure &gt; 0 |

Kill **remoto** (outro nó na rede) não faz parte do automático — use `POST /v1/control/leader-kill` só em testes manuais.

`scripts/lab-env-init.sh`: **`./lab start`** → `SIM_TX_ENABLED=true` e `SIM_LEADER_SELF_TERM=true`; join/só nó → desligados.

## Configuração

- [`lab.env`](../../lab.env) — perfil local
- [`lab.env.example`](../../lab.env.example)

## Docker / npm

Ver [README.md](../../README.md) e [03_entrypoints_e_build.md](03_entrypoints_e_build.md).
