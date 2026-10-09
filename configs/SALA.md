# Sala / LAN

1. **Um** `./lab storage` na máquina do ledger (qualquer ordem em relação aos nós).
2. Demais PCs: `./lab node` (ou `./lab start` só no PC que simula 4 nós).
3. Narrativa em qualquer máquina: `./lab logs` (processo local, não container).
4. Mesma Wi‑Fi; firewall UDP **5353**, TCP **4000**, TCP **3002+**.
5. mDNS falhou: `LAB_STORAGE_HOST=<IP>` no `lab.env`.
6. `LAB_HOST_NAME` único por notebook (opcional).

Comandos antigos `./lab join` e `./lab tail` foram unificados em `./lab node` / `./lab start` e `./lab logs`.
