# 08 Utilitários (`src/server/utils/`)

## IpsToObjectSorted.js

Converte `IP_LIST` (CSV) ou objeto existente em mapa **ordenado por porta**:

- Chave: `parseInt(ultimoOcteto) + 3000`
- Valor: string IP

Ex.: `172.25.0.5` → chave `3005`.

**Implicação:** o esquema assume IPs `172.25.0.x` com `x` igual ao último octeto usado na fórmula de porta. Mudar a rede exige revisar esta função e o compose.

## GetClientPort.js

Dado um IP, retorna último octeto + 3000 (mesma regra).

## GetClientIp.js

Extrai IP do handshake Socket.IO (`socket.handshake.address`), com tratamento de IPv6 mapeado (`::ffff:`).

## ConnecToNode.js

- URL: `http://${ipString}` (adiciona `:3000` se porta omitida).
- Aguarda 3s e resolve o socket (conectado ou não).
- Usado para sucessor, coordenador e broadcast de `COORDENADOR` / `reconnect`.

## PrintEnvironmentVariables.js

Log de debug do estado do nó (`hostname`, IPs, flags de eleição/coordenador) após eventos relevantes.

## Onde alterar

| Mudança | Arquivo(s) |
| --- | --- |
| Nova regra IP ↔ porta | `IpsToObjectSorted`, `GetClientPort`, `reconnect` (reconstrói IP por porta) |
| Timeout de conexão | `ConnecToNode.js` |
| Diagnóstico | `PrintEnvironmentVariables.js` |
